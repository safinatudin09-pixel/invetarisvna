"use server";

import { revalidatePath } from "next/cache";
import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { generateTransactionReferenceNo } from "@/lib/reference-generator";
import {
  stockInSchema,
  stockOutSchema,
  stockAdjustmentSchema,
  StockInValues,
  StockOutValues,
  StockAdjustmentValues,
} from "@/validations/transaction.schema";

export interface GetTransactionsFilter {
  search?: string;
  type?: "ALL" | "IN" | "OUT" | "ADJUSTMENT";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 1. CORE ENGINE: BARANG MASUK (IN)
 * Menggunakan prisma.$transaction (ACID) untuk:
 * - Membuat header Transaction & TransactionItem
 * - Menambah currentStock masing-masing Product
 * - Mencatat mutasi ke StockLog
 */
export async function createStockInTransaction(values: StockInValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return {
      success: false,
      error: "Akses ditolak. Role Anda tidak diizinkan menginput Barang Masuk.",
    };
  }

  const parsed = stockInSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input Barang Masuk tidak valid.",
    };
  }

  const { supplierId, notes, transactionDate, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const referenceNo = await generateTransactionReferenceNo(tx);

      const transaction = await tx.transaction.create({
        data: {
          referenceNo,
          type: TransactionType.IN,
          supplierId,
          userId: user.id,
          notes: notes || null,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        },
      });

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        const previousStock = product.currentStock;
        const newStock = previousStock + item.quantity;
        const effectivePrice =
          item.unitPrice > 0 ? item.unitPrice : Number(product.buyPrice);

        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: effectivePrice,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
          },
        });

        await tx.stockLog.create({
          data: {
            productId: product.id,
            userId: user.id,
            type: TransactionType.IN,
            changeAmount: item.quantity,
            previousStock,
            newStock,
            reason: `Barang Masuk (${referenceNo})${notes ? ` - ${notes}` : ""}`,
          },
        });
      }

      return transaction;
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return {
      success: true,
      transactionId: result.id,
      referenceNo: result.referenceNo,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses transaksi Barang Masuk.";
    return { success: false, error: msg };
  }
}

/**
 * 2. CORE ENGINE: BARANG KELUAR (OUT)
 * Menggunakan prisma.$transaction (ACID) dengan VALIDASI KETAT:
 * - Memastikan quantity <= currentStock untuk setiap produk (mencegah stok minus)
 * - Mengurangi currentStock dan mencatat ke StockLog
 */
export async function createStockOutTransaction(values: StockOutValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return {
      success: false,
      error: "Akses ditolak. Role Anda tidak diizinkan menginput Barang Keluar.",
    };
  }

  const parsed = stockOutSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input Barang Keluar tidak valid.",
    };
  }

  const { destination, notes, transactionDate, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const referenceNo = await generateTransactionReferenceNo(tx);

      // Agregasi kuantitas jika produk yang sama diinput lebih dari 1 baris
      const requestedByProduct = new Map<string, number>();
      for (const item of items) {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity
        );
      }

      // Validasi ketiadaan stok minus terlebih dahulu di dalam transaksi terkunci
      for (const [productId, totalQty] of requestedByProduct.entries()) {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error("Produk tidak ditemukan di database.");
        }

        if (totalQty > product.currentStock) {
          throw new Error(
            `Stok tidak mencukupi untuk "${product.name}" (SKU: ${product.sku}). Stok tersedia: ${product.currentStock} ${product.unit}, diminta: ${totalQty} ${product.unit}.`
          );
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          referenceNo,
          type: TransactionType.OUT,
          destination: destination.trim(),
          userId: user.id,
          notes: notes || null,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        },
      });

      for (const item of items) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
        });

        const previousStock = product.currentStock;
        const newStock = previousStock - item.quantity;

        if (newStock < 0) {
          throw new Error(
            `Stok "${product.name}" tidak boleh minus (tersedia: ${previousStock}).`
          );
        }

        const effectivePrice =
          item.unitPrice > 0 ? item.unitPrice : Number(product.sellPrice);

        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: effectivePrice,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
          },
        });

        await tx.stockLog.create({
          data: {
            productId: product.id,
            userId: user.id,
            type: TransactionType.OUT,
            changeAmount: -item.quantity,
            previousStock,
            newStock,
            reason: `Barang Keluar (${referenceNo}) ke ${destination}`,
          },
        });
      }

      return transaction;
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return {
      success: true,
      transactionId: result.id,
      referenceNo: result.referenceNo,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses transaksi Barang Keluar.";
    return { success: false, error: msg };
  }
}

/**
 * 3. CORE ENGINE: STOCK OPNAME (ADJUSTMENT)
 * Pengguna menginput stok fisik aktual (physicalStock), sistem otomatis menghitung
 * selisih (physicalStock - currentStock), memperbarui currentStock, dan menyimpan alasan ke StockLog.
 */
export async function createStockAdjustmentTransaction(
  values: StockAdjustmentValues
) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return {
      success: false,
      error: "Akses ditolak. Role Anda tidak diizinkan melakukan Stock Opname.",
    };
  }

  const parsed = stockAdjustmentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data Stock Opname tidak valid.",
    };
  }

  const { notes, transactionDate, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const referenceNo = await generateTransactionReferenceNo(tx);

      const transaction = await tx.transaction.create({
        data: {
          referenceNo,
          type: TransactionType.ADJUSTMENT,
          userId: user.id,
          notes,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        },
      });

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error("Produk tidak ditemukan.");
        }

        const previousStock = product.currentStock;
        const newStock = item.physicalStock;
        const changeAmount = newStock - previousStock; // Selisih otomatis (physicalStock - currentStock)

        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: product.id,
            quantity: Math.abs(changeAmount),
            unitPrice: product.buyPrice,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
          },
        });

        await tx.stockLog.create({
          data: {
            productId: product.id,
            userId: user.id,
            type: TransactionType.ADJUSTMENT,
            changeAmount,
            previousStock,
            newStock,
            reason: `Stock Opname (${referenceNo}): ${item.reason}`,
          },
        });
      }

      return transaction;
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/transactions");
    revalidatePath("/reports");

    return {
      success: true,
      transactionId: result.id,
      referenceNo: result.referenceNo,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Gagal menyimpan hasil Stock Opname.";
    return { success: false, error: msg };
  }
}

/**
 * Ambil daftar transaksi dengan filter tipe, tanggal, pencarian, dan pagination.
 */
export async function getTransactions(filter: GetTransactionsFilter = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const {
    search = "",
    type = "ALL",
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filter;

  const where: Record<string, unknown> = {};

  if (type && type !== "ALL") {
    where.type = type;
  }

  if (search.trim()) {
    where.OR = [
      { referenceNo: { contains: search.trim(), mode: "insensitive" } },
      { destination: { contains: search.trim(), mode: "insensitive" } },
      { notes: { contains: search.trim(), mode: "insensitive" } },
      {
        supplier: {
          name: { contains: search.trim(), mode: "insensitive" },
        },
      },
    ];
  }

  if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) {
      dateRange.gte = new Date(`${startDate}T00:00:00`);
    }
    if (endDate) {
      dateRange.lte = new Date(`${endDate}T23:59:59`);
    }
    where.transactionDate = dateRange;
  }

  const [totalCount, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
          },
        },
      },
      orderBy: { transactionDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    transactions: rows.map((t) => ({
      id: t.id,
      referenceNo: t.referenceNo,
      type: t.type,
      supplierName: t.supplier?.name ?? null,
      destination: t.destination,
      notes: t.notes,
      transactionDate: t.transactionDate.toISOString(),
      userName: t.user.name,
      userRole: t.user.role,
      totalItems: t.items.length,
      totalQuantity: t.items.reduce((acc, i) => acc + i.quantity, 0),
      totalValue: t.items.reduce(
        (acc, i) => acc + i.quantity * Number(i.unitPrice),
        0
      ),
      items: t.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        sku: item.product.sku,
        productName: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    })),
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/**
 * Ambil detail 1 transaksi untuk halaman Cetak Surat Jalan / Bukti Transaksi.
 */
export async function getTransactionById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const trx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!trx) return null;

  return {
    id: trx.id,
    referenceNo: trx.referenceNo,
    type: trx.type,
    supplier: trx.supplier
      ? {
          name: trx.supplier.name,
          contactPerson: trx.supplier.contactPerson,
          phone: trx.supplier.phone,
          address: trx.supplier.address,
        }
      : null,
    destination: trx.destination,
    notes: trx.notes,
    transactionDate: trx.transactionDate.toISOString(),
    user: trx.user,
    items: trx.items.map((i) => ({
      id: i.id,
      sku: i.product.sku,
      productName: i.product.name,
      unit: i.product.unit,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: i.quantity * Number(i.unitPrice),
    })),
  };
}

/**
 * Hapus transaksi (Khusus SUPER_ADMIN sesuai aturan RBAC: STAFF tidak bisa menghapus histori transaksi).
 */
export async function deleteTransaction(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return {
      success: false,
      error: "Akses ditolak. Hanya SUPER_ADMIN yang dapat menghapus histori transaksi.",
    };
  }

  try {
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/transactions");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus transaksi.";
    return { success: false, error: msg };
  }
}
