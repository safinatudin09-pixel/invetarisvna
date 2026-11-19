"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions/product.actions";
import { productSchema, ProductFormValues } from "@/validations/product.schema";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { formatRupiah } from "@/lib/utils";
import { exportToSpreadsheet } from "@/lib/export-excel";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface ProductRow {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
  imageUrl: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductsClientProps {
  initialProducts: ProductRow[];
  categories: CategoryOption[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  canViewBuyPrice: boolean;
  userRole: Role;
  currentSearch: string;
  currentCategory: string;
  currentStockStatus: string;
}

export function ProductsClient({
  initialProducts,
  categories,
  totalCount,
  totalPages,
  currentPage,
  canViewBuyPrice,
  userRole,
  currentSearch,
  currentCategory,
  currentStockStatus,
}: ProductsClientProps) {
  const router = useRouter();
  const canMutate = canMutateInventory(userRole);
  const canDelete = isSuperAdmin(userRole);

  const [search, setSearch] = useState(currentSearch);
  const [categoryFilter, setCategoryFilter] = useState(currentCategory);
  const [stockFilter, setStockFilter] = useState(currentStockStatus);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      name: "",
      categoryId: categories[0]?.id ?? "",
      unit: "Pcs",
      buyPrice: 0,
      sellPrice: 0,
      currentStock: 0,
      minStock: 5,
      imageUrl: "",
    },
  });

  const applyFilter = (
    nextPage = 1,
    nextSearch = search,
    nextCategory = categoryFilter,
    nextStock = stockFilter
  ) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory !== "ALL") params.set("categoryId", nextCategory);
    if (nextStock !== "ALL") params.set("stockStatus", nextStock);
    params.set("page", String(nextPage));
    router.push(`/products?${params.toString()}`);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      sku: "",
      barcode: "",
      name: "",
      categoryId: categories[0]?.id ?? "",
      unit: "Pcs",
      buyPrice: 0,
      sellPrice: 0,
      currentStock: 0,
      minStock: 5,
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductRow) => {
    setEditingProduct(product);
    reset({
      sku: product.sku,
      barcode: product.barcode ?? "",
      name: product.name,
      categoryId: product.categoryId,
      unit: product.unit,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      currentStock: product.currentStock,
      minStock: product.minStock,
      imageUrl: product.imageUrl ?? "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: ProductFormValues) => {
    const res = editingProduct
      ? await updateProduct(editingProduct.id, values)
      : await createProduct(values);

    if (!res.success) {
      toast.error(res.error || "Terjadi kesalahan.");
      return;
    }

    toast.success(
      editingProduct
        ? "Produk berhasil diperbarui!"
        : "Produk baru berhasil ditambahkan!"
    );
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = async (product: ProductRow) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${product.name}" (SKU: ${product.sku})?`
      )
    ) {
      return;
    }

    const res = await deleteProduct(product.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success("Produk berhasil dihapus.");
    router.refresh();
  };

  const handleExport = (format: "xlsx" | "csv") => {
    const exportRows = initialProducts.map((p) => {
      const base: Record<string, unknown> = {
        SKU: p.sku,
        Barcode: p.barcode || "-",
        "Nama Produk": p.name,
        Kategori: p.categoryName,
        Satuan: p.unit,
      };
      if (canViewBuyPrice) {
        base["Harga Beli (IDR)"] = p.buyPrice;
      }
      base["Harga Jual (IDR)"] = p.sellPrice;
      base["Stok Saat Ini"] = p.currentStock;
      base["Minimum Stok"] = p.minStock;
      base["Status Stok"] =
        p.currentStock <= p.minStock ? "LOW STOCK" : "AMAN";
      return base;
    });

    exportToSpreadsheet(exportRows, "Data-Stok-Produk", format, "Stok Produk");
    toast.success(`Berhasil mengekspor data produk ke .${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Master Produk & Daftar Stok
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola katalog SKU, pantau ketersediaan stok, dan buka Kartu Stok per item.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
          >
            <Download className="h-4 w-4" />
            Ekspor Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          {canMutate && (
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Tambah Produk Baru
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilter(1);
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan SKU, Barcode, atau Nama Produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                applyFilter(1, search, e.target.value, stockFilter);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                applyFilter(1, search, categoryFilter, e.target.value);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="LOW">Low Stock (≤ Min. Stok)</option>
              <option value="SAFE">Stok Aman (&gt; Min. Stok)</option>
            </select>
          </form>
        </CardContent>
      </Card>

      {/* Tabel Produk */}
      <Card>
        <CardContent className="p-0">
          {initialProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada produk ditemukan.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  {canViewBuyPrice && (
                    <TableHead className="text-right">Harga Beli</TableHead>
                  )}
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialProducts.map((product) => {
                  const isLow = product.currentStock <= product.minStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-mono text-xs font-bold text-slate-800">
                          {product.sku}
                        </p>
                        {product.barcode && (
                          <p className="text-[11px] text-slate-400">
                            {product.barcode}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Min. Stok: {product.minStock} {product.unit}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.categoryName}</Badge>
                      </TableCell>
                      {canViewBuyPrice && (
                        <TableCell className="text-right font-medium text-slate-600">
                          {formatRupiah(product.buyPrice)}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-semibold text-slate-900">
                        {formatRupiah(product.sellPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            isLow
                              ? "font-bold text-red-600"
                              : "font-bold text-emerald-700"
                          }
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLow ? "warning" : "success"}>
                          {isLow ? "Low Stock" : "Tersedia"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={`/products/${product.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Lihat Kartu Stok"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Kartu Stok
                            </Button>
                          </Link>
                          {canMutate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(product)}
                              title="Edit Produk"
                            >
                              <Edit3 className="h-4 w-4 text-slate-600" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product)}
                              title="Hapus Produk"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Bar */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Total <strong>{totalCount}</strong> produk terdaftar (Halaman{" "}
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

      {/* Modal Form Tambah / Edit Produk */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
        description="Lengkapi informasi SKU, kategori, satuan, dan batas minimum stok."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Kode SKU (Unik) *</Label>
              <Input placeholder="Contoh: ELK-005" {...register("sku")} />
              {errors.sku && (
                <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <Label>Nomor Barcode (Opsional)</Label>
              <Input
                placeholder="Contoh: 8991002003005"
                {...register("barcode")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Nama Produk *</Label>
              <Input
                placeholder="Contoh: Scanner Barcode Wireless 2D"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label>Kategori *</Label>
              <select
                {...register("categoryId")}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <Label>Satuan (Unit/Pcs/Box/Kg/Roll) *</Label>
              <Input placeholder="Pcs / Box / Unit" {...register("unit")} />
              {errors.unit && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.unit.message}
                </p>
              )}
            </div>

            {canViewBuyPrice && (
              <div>
                <Label>Harga Beli Satuan (IDR) *</Label>
                <Input type="number" step="any" {...register("buyPrice")} />
                {errors.buyPrice && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.buyPrice.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Harga Jual Satuan (IDR) *</Label>
              <Input type="number" step="any" {...register("sellPrice")} />
              {errors.sellPrice && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.sellPrice.message}
                </p>
              )}
            </div>

            {!editingProduct && (
              <div>
                <Label>Saldo Stok Awal</Label>
                <Input type="number" {...register("currentStock")} />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Otomatis tercatat di StockLog
                </p>
              </div>
            )}

            <div>
              <Label>Batas Peringatan Minimum Stok *</Label>
              <Input type="number" {...register("minStock")} />
              {errors.minStock && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.minStock.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
