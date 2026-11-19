"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createStockOutTransaction } from "@/actions/transaction.actions";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sellPrice: number;
  currentStock: number;
}

interface StockOutFormProps {
  products: ProductOption[];
}

export function StockOutForm({ products }: StockOutFormProps) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    {
      productId: products[0]?.id ?? "",
      quantity: 1,
      unitPrice: products[0]?.sellPrice ?? 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItemRow = () => {
    const first = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: first?.id ?? "",
        quantity: 1,
        unitPrice: first?.sellPrice ?? 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const found = products.find((p) => p.id === newProductId);
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              productId: newProductId,
              unitPrice: found?.sellPrice ?? 0,
            }
          : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi ketat di client sebelum kirim ke server ACID transaction
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.quantity > prod.currentStock) {
        toast.error(
          `Kuantitas "${prod.name}" (${item.quantity}) melebihi stok tersedia (${prod.currentStock} ${prod.unit}). Stok minus tidak diizinkan!`
        );
        return;
      }
    }

    setIsSubmitting(true);
    const res = await createStockOutTransaction({
      destination,
      transactionDate,
      notes,
      items,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(
      `Barang Keluar ${res.referenceNo} berhasil disimpan! Membuka Surat Jalan...`
    );
    router.push(`/transactions/${res.transactionId}/print`);
    router.refresh();
  };

  const grandTotal = items.reduce(
    (acc, item) =>
      acc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Input Barang Keluar (Stock Out)
          </h1>
          <p className="text-sm text-slate-500">
            Validasi otomatis mencegah stok minus (`quantity ≤ currentStock`) dan menyiapkan Surat Jalan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tujuan Pengiriman / Pengeluaran Barang</CardTitle>
            <CardDescription>
              Lengkapi tujuan pengiriman atau divisi penerima untuk dicetak pada Surat Jalan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tujuan / Penerima Barang *</Label>
              <Input
                required
                placeholder="Contoh: Cabang Surabaya / Pelanggan PT Maju Bersama"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div>
              <Label>Tanggal Pengeluaran *</Label>
              <Input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Catatan Pengiriman</Label>
              <Textarea
                placeholder="Catatan tambahan pengiriman, nomor kendaraan, atau instruksi kurir..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Item Barang Keluar</CardTitle>
              <CardDescription>
                Kuantitas yang dikeluarkan tidak boleh melebihi saldo stok saat ini.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
            >
              <Plus className="h-4 w-4" />
              Tambah Baris Produk
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item, idx) => {
              const selectedProd = products.find(
                (p) => p.id === item.productId
              );
              const maxStock = selectedProd?.currentStock ?? 0;
              const isOverStock = item.quantity > maxStock;

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg border p-4 ${
                    isOverStock
                      ? "border-red-300 bg-red-50/50"
                      : "border-slate-200 bg-slate-50/60"
                  }`}
                >
                  <div className="md:col-span-5">
                    <Label>Pilih Produk *</Label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} — Tersedia: {p.currentStock}{" "}
                          {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label>
                      Jumlah Keluar (Maks: {maxStock}{" "}
                      {selectedProd?.unit || "Unit"}) *
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={maxStock}
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, quantity: val } : r
                          )
                        );
                      }}
                    />
                    {isOverStock && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Melebihi stok tersedia ({maxStock})!
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <Label>Harga Satuan (IDR)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, unitPrice: val } : r
                          )
                        );
                      }}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length <= 1}
                      onClick={() => removeItemRow(idx)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  Total Nilai Barang Keluar:
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {formatRupiah(grandTotal)}
                </p>
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting
                  ? "Memvalidasi & Menyimpan..."
                  : "Simpan & Cetak Surat Jalan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
