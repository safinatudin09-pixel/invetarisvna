"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { createStockAdjustmentTransaction } from "@/actions/transaction.actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  currentStock: number;
}

interface StockAdjustmentFormProps {
  products: ProductOption[];
}

export function StockAdjustmentForm({ products }: StockAdjustmentFormProps) {
  const router = useRouter();
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(
    "Berita Acara Stock Opname Berkala Gudang"
  );
  const [items, setItems] = useState([
    {
      productId: products[0]?.id ?? "",
      physicalStock: products[0]?.currentStock ?? 0,
      reason: "Penyesuaian hasil hitung fisik gudang",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItemRow = () => {
    const first = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: first?.id ?? "",
        physicalStock: first?.currentStock ?? 0,
        reason: "Penyesuaian hasil hitung fisik gudang",
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
              physicalStock: found?.currentStock ?? 0,
            }
          : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createStockAdjustmentTransaction({
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
      `Stock Opname ${res.referenceNo} berhasil disimpan dan memperbarui saldo stok!`
    );
    router.push("/transactions");
    router.refresh();
  };

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
            Formulir Stock Opname (Stock Adjustment)
          </h1>
          <p className="text-sm text-slate-500">
            Input jumlah stok fisik aktual di gudang. Sistem otomatis menghitung selisih (`physicalStock - currentStock`) dan mencatat alasan ke Audit Trail.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Header Berita Acara Stock Opname</CardTitle>
            <CardDescription>
              Catat tanggal pelaksanaan audit fisik dan keterangan umum opname.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tanggal Pelaksanaan Opname *</Label>
              <Input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Keterangan Berita Acara *</Label>
              <Input
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Audit stok akhir bulan Gudang Utama"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rincian Perhitungan Stok Fisik</CardTitle>
              <CardDescription>
                Masukkan angka stok fisik hasil perhitungan riil dan alasan selisihnya.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
            >
              <Plus className="h-4 w-4" />
              Tambah Produk Opname
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.map((item, idx) => {
              const selectedProd = products.find(
                (p) => p.id === item.productId
              );
              const systemStock = selectedProd?.currentStock ?? 0;
              const diff = item.physicalStock - systemStock;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="md:col-span-4">
                    <Label>Pilih Produk *</Label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Stok Sistem</Label>
                    <Input
                      disabled
                      value={`${systemStock} ${selectedProd?.unit ?? ""}`}
                      className="font-mono font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Stok Fisik Aktual *</Label>
                    <Input
                      type="number"
                      min={0}
                      required
                      value={item.physicalStock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, physicalStock: val } : r
                          )
                        );
                      }}
                    />
                  </div>

                  <div className="md:col-span-1 flex flex-col justify-center pb-1">
                    <span className="text-[11px] font-medium text-slate-500 mb-1">
                      Selisih:
                    </span>
                    <Badge
                      variant={
                        diff > 0
                          ? "success"
                          : diff < 0
                          ? "destructive"
                          : "secondary"
                      }
                      className="justify-center font-mono"
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </Badge>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Alasan Penyesuaian *</Label>
                    <Input
                      required
                      placeholder="Rusak / Selisih hitung..."
                      value={item.reason}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, reason: val } : r
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

            <div className="flex justify-end border-t border-slate-200 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting
                  ? "Menyimpan Penyesuaian..."
                  : "Simpan Hasil Stock Opname"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
