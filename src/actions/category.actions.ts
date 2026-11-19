"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { categorySchema, CategoryFormValues } from "@/validations/master.schema";

export async function getCategories(search = "") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const categories = await prisma.category.findMany({
    where: search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { description: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    productCount: c._count.products,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createCategory(values: CategoryFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data kategori tidak valid.",
    };
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { name: parsed.data.name.trim() },
    });
    if (existing) {
      return { success: false, error: "Nama kategori sudah terdaftar." };
    }

    await prisma.category.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description || null,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menambah kategori.";
    return { success: false, error: msg };
  }
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data kategori tidak valid.",
    };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description || null,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengubah kategori.";
    return { success: false, error: msg };
  }
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return {
      success: false,
      error: "Hanya SUPER_ADMIN yang dapat menghapus kategori.",
    };
  }

  try {
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      return {
        success: false,
        error: `Kategori tidak bisa dihapus karena masih digunakan oleh ${productCount} produk.`,
      };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/categories");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus kategori.";
    return { success: false, error: msg };
  }
}
