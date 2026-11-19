"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { supplierSchema, SupplierFormValues } from "@/validations/master.schema";

export async function getSuppliers(search = "") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const suppliers = await prisma.supplier.findMany({
    where: search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { contactPerson: { contains: search.trim(), mode: "insensitive" } },
            { phone: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    address: s.address,
    transactionCount: s._count.transactions,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function createSupplier(values: SupplierFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data supplier tidak valid.",
    };
  }

  try {
    await prisma.supplier.create({
      data: {
        name: parsed.data.name.trim(),
        contactPerson: parsed.data.contactPerson || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
      },
    });

    revalidatePath("/suppliers");
    revalidatePath("/transactions/in");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menambah supplier.";
    return { success: false, error: msg };
  }
}

export async function updateSupplier(id: string, values: SupplierFormValues) {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data supplier tidak valid.",
    };
  }

  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        contactPerson: parsed.data.contactPerson || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
      },
    });

    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui supplier.";
    return { success: false, error: msg };
  }
}

export async function deleteSupplier(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return {
      success: false,
      error: "Hanya SUPER_ADMIN yang dapat menghapus supplier.",
    };
  }

  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus supplier.";
    return { success: false, error: msg };
  }
}
