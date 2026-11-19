import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(100, "Nama kategori maksimal 100 karakter"),
  description: z
    .string()
    .max(300, "Deskripsi maksimal 300 karakter")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, "Nama supplier minimal 2 karakter")
    .max(150, "Nama supplier maksimal 150 karakter"),
  contactPerson: z
    .string()
    .max(100, "Nama PIC maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(30, "Nomor telepon maksimal 30 karakter")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(400, "Alamat maksimal 400 karakter")
    .optional()
    .or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const userCreateSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["SUPER_ADMIN", "STAFF", "VIEWER"]),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "STAFF", "VIEWER"]),
  isActive: z.boolean().default(true),
});

export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
