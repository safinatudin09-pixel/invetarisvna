"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { Plus, Search, Edit3, Trash2, Truck, Phone, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/actions/supplier.actions";
import { supplierSchema, SupplierFormValues } from "@/validations/master.schema";
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

interface SupplierItem {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  transactionCount: number;
}

interface SuppliersClientProps {
  suppliers: SupplierItem[];
  userRole: Role;
}

export function SuppliersClient({ suppliers, userRole }: SuppliersClientProps) {
  const router = useRouter();
  const canMutate = canMutateInventory(userRole);
  const canDelete = isSuperAdmin(userRole);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      address: "",
    },
  });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", contactPerson: "", phone: "", address: "" });
    setIsModalOpen(true);
  };

  const openEdit = (item: SupplierItem) => {
    setEditing(item);
    reset({
      name: item.name,
      contactPerson: item.contactPerson ?? "",
      phone: item.phone ?? "",
      address: item.address ?? "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    const res = editing
      ? await updateSupplier(editing.id, values)
      : await createSupplier(values);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(
      editing ? "Data supplier diperbarui!" : "Supplier baru ditambahkan!"
    );
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = async (item: SupplierItem) => {
    if (!window.confirm(`Hapus supplier "${item.name}"?`)) return;
    const res = await deleteSupplier(item.id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Supplier dihapus.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Master Data Supplier
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar mitra pemasok barang untuk pencatatan transaksi Barang Masuk (IN).
          </p>
        </div>

        {canMutate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama perusahaan, PIC, atau nomor telepon..."
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
              <Truck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Tidak ada supplier ditemukan.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Perusahaan Supplier</TableHead>
                  <TableHead>Contact Person (PIC)</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-center">Total PO Masuk</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        {item.contactPerson || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {item.phone || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-slate-600">
                      {item.address || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {item.transactionCount} Transaksi
                      </Badge>
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
        title={editing ? "Edit Data Supplier" : "Tambah Supplier Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nama Perusahaan Supplier *</Label>
            <Input
              placeholder="Contoh: PT Nusantara Distribusi Teknologi"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nama Contact Person (PIC)</Label>
              <Input placeholder="Contoh: Hendra Wijaya" {...register("contactPerson")} />
            </div>
            <div>
              <Label>Nomor Telepon / WhatsApp</Label>
              <Input placeholder="0812-xxxx-xxxx" {...register("phone")} />
            </div>
          </div>
          <div>
            <Label>Alamat Lengkap</Label>
            <Textarea
              placeholder="Alamat kantor atau gudang pemasok..."
              {...register("address")}
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
              {isSubmitting ? "Menyimpan..." : "Simpan Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
