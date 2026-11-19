"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, Package, History } from "lucide-react";
import { toast } from "sonner";
import { exportToSpreadsheet } from "@/lib/export-excel";
import { formatDate, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProductReportRow {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryName: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
}

interface TransactionReportRow {
  id: string;
  referenceNo: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  supplierName: string | null;
  destination: string | null;
  notes: string | null;
  transactionDate: string;
  userName: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
}

interface ReportsClientProps {
  products: ProductReportRow[];
  transactions: TransactionReportRow[];
  canViewBuyPrice: boolean;
}

export function ReportsClient({
  products,
  transactions,
  canViewBuyPrice,
}: ReportsClientProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
    const trxTime = new Date(t.transactionDate).getTime();
    if (startDate) {
      const s = new Date(`${startDate}T00:00:00`).getTime();
      if (trxTime < s) return false;
    }
    if (endDate) {
      const e = new Date(`${endDate}T23:59:59`).getTime();
      if (trxTime > e) return false;
    }
    return true;
  });

  const exportStockReport = (format: "xlsx" | "csv") => {
    const rows = products.map((p) => {
      const row: Record<string, unknown> = {
        SKU: p.sku,
        Barcode: p.barcode || "-",
        "Nama Produk": p.name,
        Kategori: p.categoryName,
        Satuan: p.unit,
        "Stok Saat Ini": p.currentStock,
        "Min. Stok": p.minStock,
        Status: p.currentStock <= p.minStock ? "LOW STOCK" : "AMAN",
      };
      if (canViewBuyPrice) {
        row["Harga Beli Satuan (IDR)"] = p.buyPrice;
        row["Total Valuasi Aset (IDR)"] = p.currentStock * p.buyPrice;
      }
      row["Harga Jual Satuan (IDR)"] = p.sellPrice;
      return row;
    });

    exportToSpreadsheet(
      rows,
      `Laporan-Stok-Inventaris-${new Date().toISOString().slice(0, 10)}`,
      format,
      "Laporan Stok"
    );
    toast.success(`Laporan stok berhasil diekspor ke format .${format}`);
  };

  const exportTransactionReport = (format: "xlsx" | "csv") => {
    const rows = filteredTransactions.map((t) => ({
      "No. Referensi": t.referenceNo,
      "Tanggal Transaksi": formatDate(t.transactionDate),
      "Tipe Transaksi": t.type,
      "Supplier / Tujuan":
        t.type === "IN"
          ? t.supplierName || "-"
          : t.type === "OUT"
          ? t.destination || "-"
          : "Stock Opname",
      "Jumlah SKU": t.totalItems,
      "Total Kuantitas": t.totalQuantity,
      "Total Nilai (IDR)": t.totalValue,
      Catatan: t.notes || "-",
      Petugas: t.userName,
    }));

    exportToSpreadsheet(
      rows,
      `Laporan-Mutasi-Transaksi-${new Date().toISOString().slice(0, 10)}`,
      format,
      "Laporan Transaksi"
    );
    toast.success(`Laporan transaksi berhasil diekspor ke format .${format}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pusat Laporan & Ekspor Data (CSV / Excel)
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Unduh laporan posisi stok terkini, valuasi aset, dan rekapitulasi histori transaksi gudang.
        </p>
      </div>

      {/* Bagian 1: Ekspor Laporan Stok & Valuasi */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>1. Laporan Posisi Stok & Valuasi Aset</CardTitle>
              <CardDescription>
                Mencakup seluruh SKU ({products.length} item), status ketersediaan, serta nilai aset inventaris.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => exportStockReport("xlsx")}>
              <FileSpreadsheet className="h-4 w-4" />
              Unduh Excel (.xlsx)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportStockReport("csv")}
            >
              <Download className="h-4 w-4" />
              Unduh CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Bagian 2: Laporan Transaksi dengan Filter Tanggal */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>2. Laporan Riwayat Transaksi (IN / OUT / ADJUSTMENT)</CardTitle>
              <CardDescription>
                Filter periode tanggal transaksi sebelum mengunduh ke Excel atau CSV.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => exportTransactionReport("xlsx")}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Ekspor Transaksi (.xlsx)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportTransactionReport("csv")}
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <Label>Filter Tipe Transaksi</Label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="ALL">Semua Tipe (IN, OUT, ADJUSTMENT)</option>
                <option value="IN">Barang Masuk (IN)</option>
                <option value="OUT">Barang Keluar (OUT)</option>
                <option value="ADJUSTMENT">Stock Opname (ADJUSTMENT)</option>
              </select>
            </div>

            <div>
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Preview Tabel Laporan Transaksi */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Referensi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Supplier / Tujuan</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Nilai Transaksi</TableHead>
                <TableHead>Petugas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    {t.referenceNo}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(t.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.type === "IN"
                          ? "success"
                          : t.type === "OUT"
                          ? "destructive"
                          : "info"
                      }
                    >
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.type === "IN"
                      ? t.supplierName || "-"
                      : t.type === "OUT"
                      ? t.destination || "-"
                      : "Stock Opname"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {t.totalQuantity}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatRupiah(t.totalValue)}
                  </TableCell>
                  <TableCell className="text-xs">{t.userName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
