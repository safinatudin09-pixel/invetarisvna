"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { Plus, Search, Edit3, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/category.actions";
import { categorySchema, CategoryFormValues } from "@/validations/master.schema";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
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

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
}

interface CategoriesClientProps {
  categories: CategoryItem[];
  userRole: Role;
}

export function CategoriesClient({
  categories,
  userRole,
}: CategoriesClientProps) {
  const router = useRouter();
  const canMutate = canMutateInventory(userRole);
  const canDelete = isSuperAdmin(userRole);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: CategoryItem) => {
    setEditing(item);
    reset({ name: item.name, description: item.description ?? "" });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    const res = editing
      ? await updateCategory(editing.id, values)
      : await createCategory(values);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(
      editing ? "Kategori berhasil diperbarui!" : "Kategori berhasil dibuat!"
    );
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = async (item: CategoryItem) => {
    if (!window.confirm(`Hapus kategori "${item.name}"?`)) return;
    const res = await deleteCategory(item.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Kategori dihapus.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Master Kategori Barang
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelompokkan katalog produk berdasarkan kategori operasional gudang.
          </p>
        </div>

        {canMutate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau deskripsi kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Tags className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Tidak ada kategori yang cocok.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-center">Jumlah Produk</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="info">{item.productCount} SKU</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {canMutate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                          >
                            <Edit3 className="h-4 w-4 text-slate-600" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
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
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Kategori" : "Tambah Kategori Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Kategori *</Label>
            <Input
              placeholder="Contoh: Elektronik & Perangkat Kasir"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea
              placeholder="Keterangan singkat kategori..."
              {...register("description")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
