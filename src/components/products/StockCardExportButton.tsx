"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportToSpreadsheet } from "@/lib/export-excel";
import { formatDate } from "@/lib/utils";

interface StockLogItem {
  id: string;
  type: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
  userName: string;
  userRole: string;
}

interface StockCardExportButtonProps {
  sku: string;
  productName: string;
  unit: string;
  logs: StockLogItem[];
}

export function StockCardExportButton({
  sku,
  productName,
  unit,
  logs,
}: StockCardExportButtonProps) {
  const handleExport = (format: "xlsx" | "csv") => {
    const rows = logs.map((l) => ({
      "Waktu Mutasi": formatDate(l.createdAt),
      SKU: sku,
      "Nama Produk": productName,
      "Tipe Mutasi": l.type,
      "Stok Awal": l.previousStock,
      "Perubahan (Qty)": l.changeAmount > 0 ? `+${l.changeAmount}` : l.changeAmount,
      "Saldo Akhir": l.newStock,
      Satuan: unit,
      "Keterangan / Referensi": l.reason || "-",
      "Petugas Pelaksana": l.userName,
    }));

    exportToSpreadsheet(rows, `Kartu-Stok-${sku}`, format, "Kartu Stok");
    toast.success(`Kartu stok ${sku} berhasil diekspor ke .${format}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
        <Download className="h-4 w-4" />
        Ekspor Kartu Stok (.xlsx)
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
    </div>
  );
}
