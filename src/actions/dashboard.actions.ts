"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewFinancialValuation } from "@/lib/rbac";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // 1. Ambil semua produk untuk kalkulasi presisi: Total SKU, Nilai Aset, dan Low Stock
  const allProducts = await prisma.product.findMany({
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: {
      currentStock: "asc",
    },
  });

  const totalSku = allProducts.length;

  // Hitung Total Nilai Aset = sum(currentStock * buyPrice)
  const rawAssetValue = allProducts.reduce((sum, p) => {
    return sum + p.currentStock * Number(p.buyPrice);
  }, 0);

  // Filter item Low Stock (currentStock <= minStock)
  const lowStockProducts = allProducts
    .filter((p) => p.currentStock <= p.minStock)
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryName: p.category.name,
      unit: p.unit,
      currentStock: p.currentStock,
      minStock: p.minStock,
      buyPrice: canViewFinancialValuation(user.role) ? Number(p.buyPrice) : null,
    }));

  // 2. Hitung Transaksi Hari Ini
  const todayTransactionsCount = await prisma.transaction.count({
    where: {
      transactionDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 3. Ambil data StockLog 30 hari terakhir untuk grafik Tren Barang Masuk vs Keluar (7 & 30 hari)
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));

  const recentLogs = await prisma.stockLog.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
      type: {
        in: ["IN", "OUT"],
      },
    },
    select: {
      type: true,
      changeAmount: true,
      createdAt: true,
    },
  });

  // Susun bucket harian selama 30 hari terakhir
  const dailyMap = new Map<
    string,
    { dateKey: string; label: string; barangMasuk: number; barangKeluar: number }
  >();

  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "dd MMM", { locale: localeId });
    dailyMap.set(key, {
      dateKey: key,
      label,
      barangMasuk: 0,
      barangKeluar: 0,
    });
  }

  for (const log of recentLogs) {
    const key = format(log.createdAt, "yyyy-MM-dd");
    const bucket = dailyMap.get(key);
    if (bucket) {
      if (log.type === "IN") {
        bucket.barangMasuk += Math.abs(log.changeAmount);
      } else if (log.type === "OUT") {
        bucket.barangKeluar += Math.abs(log.changeAmount);
      }
    }
  }

  const trend30Days = Array.from(dailyMap.values());
  const trend7Days = trend30Days.slice(-7);

  return {
    kpis: {
      totalSku,
      totalAssetValue: canViewFinancialValuation(user.role) ? rawAssetValue : null,
      lowStockCount: lowStockProducts.length,
      todayTransactionsCount,
    },
    trend7Days,
    trend30Days,
    lowStockProducts,
    userRole: user.role,
  };
}
