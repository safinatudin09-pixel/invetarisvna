"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory, isSuperAdmin, canViewFinancialValuation } from "@/lib/rbac";
import { productSchema, ProductFormValues } from "@/validations/product.schema";
import { TransactionType } from "@prisma/client";

export interface GetProductsParams {
  search?: string;
  categoryId?: string;
  stockStatus?: "ALL" | "LOW" | "SAFE";
  page?: number;
  pageSize?: number;
}

export async function getProducts(params: GetProductsParams = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const {
    search = "",
    categoryId = "ALL",
    stockStatus = "ALL",
    page = 1,
    pageSize = 10,
  } = params;

  const whereClause: Record<string, unknown> = {};

  if (search.trim()) {
    whereClause.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { sku: { contains: search.trim(), mode: "insensitive" } },
      { barcode: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (categoryId && categoryId !== "ALL") {
    whereClause.categoryId = categoryId;
  }

  const allMatched = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter status stok (LOW vs SAFE)
  const filteredByStock = allMatched.filter((p) => {
    if (stockStatus === "LOW") return p.currentStock <= p.minStock;
    if (stockStatus === "SAFE") return p.currentStock > p.minStock;
    return true;
  });

  const totalCount = filteredByStock.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginated = filteredByStock.slice((page - 1) * pageSize, page * pageSize);

  const showBuyPrice = canViewFinancialValuation(user.role);

  const serialized = paginated.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    unit: p.unit,
    buyPrice: showBuyPrice ? Number(p.buyPrice) : 0,
    sellPrice: Number(p.sellPrice),
    currentStock: p.currentStock,
    minStock: p.minStock,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return {
    products: serialized,
    totalCount,
    totalPages,
    currentPage: page,
    canViewBuyPrice: showBuyPrice,
  };
}

export async function getAllProductsSimple() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    categoryName: p.category.name,
    unit: p.unit,
    buyPrice: Number(p.buyPrice),
    sellPrice: Number(p.sellPrice),
    currentStock: p.currentStock,
    minStock: p.minStock,
  }));
}

export async function getProductStockCard(productId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      stockLogs: {
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) return null;

  const showBuyPrice = canViewFinancialValuation(user.role);

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    categoryName: product.category.name,
    unit: product.unit,
    buyPrice: showBuyPrice ? Number(product.buyPrice) : null,
    sellPrice: Number(product.sellPrice),
    currentStock: product.currentStock,
    minStock: product.minStock,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt.toISOString(),
    stockLogs: product.stockLogs.map((log) => ({
      id: log.id,
      type: log.type,
      changeAmount: log.changeAmount,
      previousStock: log.previousStock,
      newStock: log.newStock,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
      userName: log.user.name,
      userRole: log.user.role,
    })),
  };
}

export async function createProduct(values: ProductFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak. Anda tidak memiliki izin menambah produk." };
  }

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data produk tidak valid.",
    };
  }

  const data = parsed.data;

  try {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return { success: false, error: `SKU "${data.sku}" sudah digunakan oleh produk lain.` };
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: data.sku,
          barcode: data.barcode || null,
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          currentStock: data.currentStock,
          minStock: data.minStock,
          imageUrl: data.imageUrl || null,
        },
      });

      if (data.currentStock > 0) {
        await tx.stockLog.create({
          data: {
            productId: created.id,
            userId: user.id,
            type: TransactionType.IN,
            changeAmount: data.currentStock,
            previousStock: 0,
            newStock: data.currentStock,
            reason: "Stok Awal Pembuatan Produk Baru",
          },
        });
      }
    });

    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat produk.";
    return { success: false, error: msg };
  }
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data produk tidak valid.",
    };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    const duplicateSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        id: { not: id },
      },
    });

    if (duplicateSku) {
      return { success: false, error: `SKU "${data.sku}" sudah digunakan produk lain.` };
    }

    // Catatan: Perubahan currentStock tidak dilakukan dari edit produk (harus lewat Transaksi / Stock Opname)
    await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        buyPrice: isSuperAdmin(user.role) ? data.buyPrice : existing.buyPrice,
        sellPrice: data.sellPrice,
        minStock: data.minStock,
        imageUrl: data.imageUrl || null,
      },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui produk.";
    return { success: false, error: msg };
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return {
      success: false,
      error: "Hanya SUPER_ADMIN yang diizinkan menghapus master produk.",
    };
  }

  try {
    const trxCount = await prisma.transactionItem.count({
      where: { productId: id },
    });

    if (trxCount > 0) {
      return {
        success: false,
        error: `Produk tidak dapat dihapus karena sudah memiliki ${trxCount} riwayat item transaksi.`,
      };
    }

    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus produk.";
    return { success: false, error: msg };
  }
}
