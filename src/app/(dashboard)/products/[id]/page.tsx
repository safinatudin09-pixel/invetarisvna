import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, PackageCheck, AlertCircle } from "lucide-react";
import { getProductStockCard } from "@/actions/product.actions";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StockCardExportButton } from "@/components/products/StockCardExportButton";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductStockCardPage({
  params,
}: ProductDetailPageProps) {
  const product = await getProductStockCard(params.id);

  if (!product) {
    notFound();
  }

  const isLowStock = product.currentStock <= product.minStock;

  return (
    <div className="space-y-6">
      {/* Navigasi & Tombol Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Kartu Stok Produk (Audit Trail)
            </h1>
            <p className="text-sm text-slate-500">
              Riwayat mutasi lengkap keluar-masuk & penyesuaian stok untuk{" "}
              <span className="font-semibold text-slate-700">{product.name}</span>
            </p>
          </div>
        </div>

        <StockCardExportButton
          sku={product.sku}
          productName={product.name}
          unit={product.unit}
          logs={product.stockLogs}
        />
      </div>

      {/* Ringkasan Informasi Produk */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                SKU: {product.sku}
              </span>
              <Badge variant="secondary">{product.categoryName}</Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900 pt-1">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500">
              Barcode: {product.barcode || "Tidak ada"} • Satuan: {product.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Saldo Stok Saat Ini
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className={`text-3xl font-extrabold ${
                  isLowStock ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {product.currentStock}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {product.unit}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {isLowStock ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Di bawah/sama dengan Min. Stok ({product.minStock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <PackageCheck className="h-3.5 w-3.5" />
                  Stok Aman (Min: {product.minStock})
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Informasi Harga
            </p>
            <div>
              <p className="text-xs text-slate-400">Harga Jual:</p>
              <p className="text-lg font-bold text-slate-900">
                {formatRupiah(product.sellPrice)}
              </p>
            </div>
            {product.buyPrice !== null && (
              <div>
                <p className="text-xs text-slate-400">Harga Beli (HPP):</p>
                <p className="text-sm font-semibold text-slate-700">
                  {formatRupiah(product.buyPrice)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabel Riwayat Mutasi StockLog */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <CardTitle>Riwayat Mutasi Kartu Stok (StockLog)</CardTitle>
          </div>
          <CardDescription>
            Setiap penambahan, pengurangan, maupun penyesuaian stok fisik tercatat secara kronologis dan tidak dapat dimanipulasi.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal & Waktu</TableHead>
                <TableHead>Tipe Mutasi</TableHead>
                <TableHead className="text-right">Stok Sebelum</TableHead>
                <TableHead className="text-right">Perubahan</TableHead>
                <TableHead className="text-right">Stok Sesudah</TableHead>
                <TableHead>Keterangan / Alasan</TableHead>
                <TableHead>Petugas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stockLogs.map((log) => {
                const isPositive = log.changeAmount > 0;
                const isZero = log.changeAmount === 0;

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-slate-600">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.type === "IN"
                            ? "success"
                            : log.type === "OUT"
                            ? "destructive"
                            : "info"
                        }
                      >
                        {log.type === "IN"
                          ? "BARANG MASUK"
                          : log.type === "OUT"
                          ? "BARANG KELUAR"
                          : "ADJUSTMENT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600">
                      {log.previousStock} {product.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      <span
                        className={
                          isPositive
                            ? "text-emerald-600"
                            : isZero
                            ? "text-slate-500"
                            : "text-red-600"
                        }
                      >
                        {isPositive ? `+${log.changeAmount}` : log.changeAmount}{" "}
                        {product.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      {log.newStock} {product.unit}
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-slate-700">
                      {log.reason || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {log.userName}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
