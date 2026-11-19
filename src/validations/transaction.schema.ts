import { z } from "zod";

export const transactionItemInputSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.coerce
    .number()
    .int("Kuantitas harus bilangan bulat")
    .positive("Kuantitas harus lebih dari 0"),
  unitPrice: z.coerce
    .number()
    .min(0, "Harga satuan tidak boleh negatif")
    .default(0),
});

/**
 * Skema Barang Masuk (IN)
 */
export const stockInSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih untuk Barang Masuk"),
  transactionDate: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  items: z
    .array(transactionItemInputSchema)
    .min(1, "Minimal harus ada 1 item produk"),
});

/**
 * Skema Barang Keluar (OUT)
 */
export const stockOutSchema = z.object({
  destination: z
    .string()
    .min(2, "Tujuan / Penerima Barang Keluar wajib diisi"),
  transactionDate: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  items: z
    .array(transactionItemInputSchema)
    .min(1, "Minimal harus ada 1 item produk"),
});

/**
 * Skema Stock Opname (ADJUSTMENT)
 * Pengguna menginput stok fisik aktual (physicalStock) dan alasan penyesuaian.
 */
export const stockAdjustmentItemSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  physicalStock: z.coerce
    .number()
    .int("Stok fisik harus bilangan bulat")
    .min(0, "Stok fisik aktual tidak boleh negatif"),
  reason: z
    .string()
    .min(3, "Alasan penyesuaian wajib diisi (min. 3 karakter)"),
});

export const stockAdjustmentSchema = z.object({
  transactionDate: z.string().optional(),
  notes: z
    .string()
    .min(3, "Catatan berita acara Stock Opname wajib diisi"),
  items: z
    .array(stockAdjustmentItemSchema)
    .min(1, "Minimal pilih 1 produk untuk Stock Opname"),
});

export type StockInValues = z.infer<typeof stockInSchema>;
export type StockOutValues = z.infer<typeof stockOutSchema>;
export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;
