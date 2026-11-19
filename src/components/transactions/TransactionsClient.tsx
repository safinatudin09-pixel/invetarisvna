"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/actions/transaction.actions";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { formatDate, formatRupiah } from "@/lib/utils";
import { exportToSpreadsheet } from "@/lib/export-excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface TransactionRow {
  id: string;
  referenceNo: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  supplierName: string | null;
  destination: string | null;
  notes: string | null;
  transactionDate: string;
  userName: string;
  userRole: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  items: {
    id: string;
    sku: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface TransactionsClientProps {
  transactions: TransactionRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  userRole: Role;
  currentSearch: string;
  currentType: string;
  currentStartDate: string;
  currentEndDate: string;
}

export function TransactionsClient({
  transactions,
  totalCount,
  totalPages,
  currentPage,
  userRole,
  currentSearch,
  currentType,
  currentStartDate,
  currentEndDate,
}: TransactionsClientProps) {
  const router = useRouter();
  const canMutate = canMutateInventory(userRole);
  const canDelete = isSuperAdmin(userRole);

  const [search, setSearch] = useState(currentSearch);
  const [typeFilter, setTypeFilter] = useState(currentType);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  const applyFilter = (
    nextPage = 1,
    nextSearch = search,
    nextType = typeFilter,
    nextStart = startDate,
    nextEnd = endDate
  ) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextType !== "ALL") params.set("type", nextType);
    if (nextStart) params.set("startDate", nextStart);
    if (nextEnd) params.set("endDate", nextEnd);
    params.set("page", String(nextPage));
    router.push(`/transactions?${params.toString()}`);
  };

  const handleDelete = async (trx: TransactionRow) => {
    if (
      !window.confirm(
        `Hapus histori transaksi "${trx.referenceNo}"? Tindakan ini hanya diizinkan untuk SUPER_ADMIN.`
      )
    ) {
      return;
    }

    const res = await deleteTransaction(trx.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(`Transaksi ${trx.referenceNo} berhasil dihapus.`);
    router.refresh();
  };

  const handleExport = (format: "xlsx" | "csv") => {
    const rows = transactions.map((t) => ({
      "No. Referensi": t.referenceNo,
      "Tanggal Transaksi": formatDate(t.transactionDate),
      "Tipe Transaksi": t.type,
      "Supplier / Tujuan":
        t.type === "IN"
          ? t.supplierName || "-"
          : t.type === "OUT"
          ? t.destination || "-"
          : "Stock Opname Internal",
      "Jumlah SKU": t.totalItems,
      "Total Kuantitas": t.totalQuantity,
      "Total Nilai (IDR)": t.totalValue,
      "Rincian Barang": t.items
        .map((i) => `${i.sku} - ${i.productName} (${i.quantity} ${i.unit})`)
        .join("; "),
      Catatan: t.notes || "-",
      Petugas: t.userName,
    }));

    exportToSpreadsheet(rows, "Laporan-Riwayat-Transaksi", format, "Transaksi");
    toast.success(`Riwayat transaksi diekspor ke .${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Riwayat Transaksi Gudang
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar seluruh transaksi Barang Masuk (IN), Barang Keluar (OUT), dan Stock Opname (ADJUSTMENT).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
          >
            <Download className="h-4 w-4" />
            Ekspor .xlsx
          </Button>
          {canMutate && (
            <>
              <Link href="/transactions/in">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <ArrowDownLeft className="h-4 w-4" />
                  Input Barang Masuk
                </Button>
              </Link>
              <Link href="/transactions/out">
                <Button size="sm" variant="destructive">
                  <ArrowUpRight className="h-4 w-4" />
                  Input Barang Keluar
                </Button>
              </Link>
              <Link href="/transactions/adjustment">
                <Button size="sm" variant="outline">
                  <ClipboardCheck className="h-4 w-4" />
                  Stock Opname
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilter(1);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari No. Referensi (TRX-...), Supplier, atau Tujuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                applyFilter(1, search, e.target.value, startDate, endDate);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="IN">Barang Masuk (IN)</option>
              <option value="OUT">Barang Keluar (OUT)</option>
              <option value="ADJUSTMENT">Stock Opname (ADJUSTMENT)</option>
            </select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                applyFilter(1, search, typeFilter, e.target.value, endDate);
              }}
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                applyFilter(1, search, typeFilter, startDate, e.target.value);
              }}
            />
          </form>
        </CardContent>
      </Card>

      {/* Tabel Transaksi */}
      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Belum ada data transaksi yang sesuai filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Referensi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Supplier / Tujuan</TableHead>
                  <TableHead>Rincian Item</TableHead>
                  <TableHead className="text-right">Nilai Transaksi</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {trx.referenceNo}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-600">
                      {formatDate(trx.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trx.type === "IN"
                            ? "success"
                            : trx.type === "OUT"
                            ? "destructive"
                            : "info"
                        }
                      >
                        {trx.type === "IN"
                          ? "IN (Masuk)"
                          : trx.type === "OUT"
                          ? "OUT (Keluar)"
                          : "OPNAME"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {trx.type === "IN"
                        ? trx.supplierName || "-"
                        : trx.type === "OUT"
                        ? trx.destination || "-"
                        : "Penyesuaian Stok Fisik"}
                      {trx.notes && (
                        <p className="text-[11px] text-slate-400 font-normal truncate max-w-[200px]">
                          Catatan: {trx.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {trx.items.map((item) => (
                          <div key={item.id} className="text-slate-700">
                            <span className="font-mono font-semibold">
                              {item.sku}
                            </span>{" "}
                            — {item.productName}{" "}
                            <span className="font-bold">
                              ({item.quantity} {item.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">
                      {formatRupiah(trx.totalValue)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {trx.userName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link href={`/transactions/${trx.id}/print`}>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Cetak Surat Jalan / Bukti Transaksi"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Surat Jalan
                          </Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(trx)}
                            title="Hapus Transaksi (Super Admin Only)"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Total <strong>{totalCount}</strong> transaksi (Halaman{" "}
              {currentPage} dari {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => applyFilter(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilter(currentPage + 1)}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
