"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Plus, Edit3, Shield, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/actions/user.actions";
import { ROLE_LABELS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  transactionCount: number;
  createdAt: string;
}

interface UsersClientProps {
  users: UserItem[];
}

export function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = editing
      ? await updateUser(editing.id, {
          name,
          email,
          password: password || undefined,
          role,
          isActive,
        })
      : await createUser({
          name,
          email,
          password,
          role,
          isActive,
        });

    setLoading(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.success(
      editing ? "Data user diperbarui!" : "User baru berhasil ditambahkan!"
    );
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen User & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Atur hak akses personel gudang (`SUPER_ADMIN`, `STAFF`, `VIEWER`) dan status keaktifan akun.
          </p>
        </div>

        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Akun User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role Akses</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead className="text-center">Total Transaksi</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {u.name}
                  </TableCell>
                  <TableCell className="text-slate-600">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.role === "SUPER_ADMIN"
                          ? "default"
                          : u.role === "STAFF"
                          ? "info"
                          : "secondary"
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <XCircle className="h-4 w-4" />
                        Nonaktif
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {u.transactionCount}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(u.createdAt, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(u)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Kelola
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Akun & Role User" : "Buat Akun User Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nama Lengkap *</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Siti Rahmawati"
            />
          </div>

          <div>
            <Label>Email Login *</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@inventaris.co.id"
            />
          </div>

          <div>
            <Label>
              {editing
                ? "Password Baru (Kosongkan jika tidak ingin mengubah)"
                : "Password *"}
            </Label>
            <Input
              type="password"
              required={!editing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <Label>Role Hak Akses (RBAC) *</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="SUPER_ADMIN">
                SUPER_ADMIN (Akses Penuh & Valuasi Aset)
              </option>
              <option value="STAFF">
                STAFF (Operasional Harian: IN, OUT, Stock Opname)
              </option>
              <option value="VIEWER">
                VIEWER (Read-Only Dashboard, Stok & Ekspor Laporan)
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="isActiveCheck"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <label
              htmlFor="isActiveCheck"
              className="text-sm font-medium text-slate-700"
            >
              Akun Aktif (Dapat masuk ke sistem)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
