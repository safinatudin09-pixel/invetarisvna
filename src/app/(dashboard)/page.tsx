import Link from "next/link";
import {
  Package,
  Wallet,
  AlertTriangle,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Lock,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard.actions";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { canMutateInventory } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockTrendChart } from "@/components/dashboard/StockTrendChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const canMutate = canMutateInventory(data.userRole);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Analitik Inventaris
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pantau stok real-time, nilai valuasi aset, dan tren keluar-masuk barang.
          </p>
        </div>

        {canMutate && (
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/transactions/in">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowDownLeft className="h-4 w-4" />
                Barang Masuk
              </Button>
            </Link>
            <Link href="/transactions/out">
              <Button size="sm" variant="destructive">
                <ArrowUpRight className="h-4 w-4" />
                Barang Keluar
              </Button>
            </Link>
            <Link href="/transactions/adjustment">
              <Button size="sm" variant="outline">
                <ClipboardCheck className="h-4 w-4" />
                Stock Opname
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total SKU */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total SKU Produk
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatNumber(data.kpis.totalSku)} SKU
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Item aktif terdaftar di katalog
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Nilai Aset (sum(currentStock * buyPrice)) */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Nilai Aset
              </p>
              {data.kpis.totalAssetValue !== null ? (
                <>
                  <p className="text-2xl font-bold text-emerald-700 mt-2">
                    {formatRupiah(data.kpis.totalAssetValue)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Akumulasi (Stok × Harga Beli)
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-slate-400 mt-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-semibold">Khusus Super Admin</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Valuasi harga beli dibatasi RBAC
                  </p>
                </>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Jumlah Item Low Stock */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Item Low Stock
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-2">
                {formatNumber(data.kpis.lowStockCount)} Item
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Stok berada di ≤ batas minimum
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Transaksi Hari Ini */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Transaksi Hari Ini
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                {formatNumber(data.kpis.todayTransactionsCount)} Trx
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Total mutasi IN, OUT & Opname
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Tren Barang Masuk vs Barang Keluar (7 & 30 Hari Terakhir) */}
      <StockTrendChart
        trend7Days={data.trend7Days}
        trend30Days={data.trend30Days}
      />

      {/* Tabel Peringatan Low Stock */}
      <LowStockTable
        items={data.lowStockProducts}
        userRole={data.userRole}
      />
    </div>
  );
}
