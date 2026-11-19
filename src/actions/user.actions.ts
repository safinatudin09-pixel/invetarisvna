"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import {
  userCreateSchema,
  userUpdateSchema,
  UserCreateValues,
  UserUpdateValues,
} from "@/validations/master.schema";

export async function getUsers(search = "") {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    throw new Error("Forbidden: Hanya SUPER_ADMIN yang dapat mengakses manajemen user.");
  }

  const users = await prisma.user.findMany({
    where: search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { email: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { transactions: true, stockLogs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    transactionCount: u._count.transactions,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createUser(values: UserCreateValues) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    return { success: false, error: "Akses ditolak. Khusus SUPER_ADMIN." };
  }

  const parsed = userCreateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data user tidak valid.",
    };
  }

  try {
    const emailLower = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      return { success: false, error: "Email sudah digunakan oleh user lain." };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email: emailLower,
        password: hashedPassword,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat user.";
    return { success: false, error: msg };
  }
}

export async function updateUser(id: string, values: UserUpdateValues) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isSuperAdmin(currentUser.role)) {
    return { success: false, error: "Akses ditolak. Khusus SUPER_ADMIN." };
  }

  const parsed = userUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data user tidak valid.",
    };
  }

  try {
    // Cegah Super Admin menonaktifkan dirinya sendiri
    if (id === currentUser.id && !parsed.data.isActive) {
      return {
        success: false,
        error: "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.",
      };
    }

    const updatePayload: Record<string, unknown> = {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.password && parsed.data.password.trim().length >= 6) {
      updatePayload.password = await bcrypt.hash(parsed.data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updatePayload,
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengubah data user.";
    return { success: false, error: msg };
  }
}
