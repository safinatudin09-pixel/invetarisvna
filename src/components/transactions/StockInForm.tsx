"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ArrowDownLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createStockInTransaction } from "@/actions/transaction.actions";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  buyPrice: number;
  currentStock: number;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface StockInFormProps {
  products: ProductOption[];
  suppliers: SupplierOption[];
}

export function StockInForm({ products, suppliers }: StockInFormProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    {
      productId: products[0]?.id ?? "",
      quantity: 1,
      unitPrice: products[0]?.buyPrice ?? 0,
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
        unitPrice: first?.buyPrice ?? 0,
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
              unitPrice: found?.buyPrice ?? 0,
            }
          : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createStockInTransaction({
      supplierId,
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
      `Transaksi Barang Masuk ${res.referenceNo} berhasil disimpan!`
    );
    router.push("/transactions");
    router.refresh();
  };

  const grandTotal = items.reduce(
    (acc, item) => acc + Number(item.quantity || 0) * Number(item.unitPrice || 0),
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
            Input Barang Masuk (Stock In)
          </h1>
          <p className="text-sm text-slate-500">
            Menambah stok gudang dari penerimaan supplier dan mencatat ke Kartu Stok (ACID Transaction).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Penerimaan Barang</CardTitle>
            <CardDescription>
              Nomor referensi (`TRX-YYYYMMDD-XXXX`) akan digenerate otomatis saat transaksi disimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Supplier Pemasok *</Label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tanggal Barang Masuk *</Label>
              <Input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Catatan Penerimaan / No. Surat Jalan Supplier</Label>
              <Textarea
                placeholder="Contoh: Penerimaan PO #102 dari ekspedisi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Item Barang Masuk</CardTitle>
              <CardDescription>
                Pilih produk dan masukkan jumlah barang yang diterima.
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
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="md:col-span-5">
                    <Label>Produk *</Label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} (Stok saat ini: {p.currentStock}{" "}
                          {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label>
                      Jumlah Masuk ({selectedProd?.unit || "Unit"}) *
                    </Label>
                    <Input
                      type="number"
                      min={1}
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
                  </div>

                  <div className="md:col-span-3">
                    <Label>Harga Beli Satuan (IDR)</Label>
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
                <p className="text-xs text-slate-500">Estimasi Nilai Barang Masuk:</p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatRupiah(grandTotal)}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting
                  ? "Memproses Transaksi..."
                  : "Simpan & Tambah Stok Gudang"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
