import { z } from "zod";

export const productSchema = z.object({
  sku: z
    .string()
    .min(2, "SKU minimal 2 karakter")
    .max(50, "SKU maksimal 50 karakter")
    .transform((val) => val.trim().toUpperCase()),
  barcode: z
    .string()
    .max(100, "Barcode maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  name: z
    .string()
    .min(3, "Nama produk minimal 3 karakter")
    .max(150, "Nama produk maksimal 150 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  unit: z.string().min(1, "Satuan (Unit/Pcs/Box/Kg) wajib diisi"),
  buyPrice: z.coerce
    .number()
    .min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z.coerce
    .number()
    .min(0, "Harga jual tidak boleh negatif"),
  currentStock: z.coerce
    .number()
    .int("Stok harus berupa bilangan bulat")
    .min(0, "Stok awal tidak boleh negatif")
    .default(0),
  minStock: z.coerce
    .number()
    .int("Minimum stok harus berupa bilangan bulat")
    .min(0, "Minimum stok tidak boleh negatif")
    .default(5),
  imageUrl: z
    .string()
    .url("Format URL gambar tidak valid")
    .optional()
    .or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof productSchema>;
