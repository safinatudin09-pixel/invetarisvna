import Link from "next/link";
import { AlertTriangle, ArrowUpRight, PlusCircle } from "lucide-react";
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
import { canMutateInventory } from "@/lib/rbac";
import { Role } from "@prisma/client";

interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

interface LowStockTableProps {
  items: LowStockItem[];
  userRole: Role;
}

export function LowStockTable({ items, userRole }: LowStockTableProps) {
  const canRestock = canMutateInventory(userRole);

  return (
    <Card className="border-amber-200/80">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Peringatan Stok Menipis (Low Stock Alert)</CardTitle>
            <CardDescription>
              Daftar item dengan stok saat ini berada di bawah atau sama dengan batas minimum (currentStock ≤ minStock)
            </CardDescription>
          </div>
        </div>

        {canRestock && (
          <Link href="/transactions/in">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              Input Barang Masuk
            </Button>
          </Link>
        )}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            Seluruh stok produk berada dalam batas aman.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Stok Saat Ini</TableHead>
                <TableHead className="text-right">Min. Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isOut = item.currentStock === 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      {item.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {item.name}
                    </TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {item.currentStock} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOut ? "destructive" : "warning"}>
                        {isOut ? "Stok Habis (0)" : "Segera Restock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/products/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Kartu Stok
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
