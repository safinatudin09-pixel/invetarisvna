import { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  STAFF: "Staff Operasional",
  VIEWER: "Viewer (Read-Only)",
};

/**
 * Hanya SUPER_ADMIN yang memiliki akses penuh ke manajemen user,
 * penghapusan master data sensitif, dan melihat harga beli / valuasi aset.
 */
export function isSuperAdmin(role?: Role | null): boolean {
  return role === Role.SUPER_ADMIN;
}

/**
 * SUPER_ADMIN dan STAFF diperbolehkan melakukan operasional harian
 * (Input Barang Masuk, Barang Keluar, Stock Opname, tambah/edit produk & master data).
 */
export function canMutateInventory(role?: Role | null): boolean {
  return role === Role.SUPER_ADMIN || role === Role.STAFF;
}

/**
 * Semua role aktif dapat melihat dashboard, stok, dan mengekspor laporan.
 */
export function canViewReports(role?: Role | null): boolean {
  return (
    role === Role.SUPER_ADMIN ||
    role === Role.STAFF ||
    role === Role.VIEWER
  );
}

/**
 * Hanya SUPER_ADMIN yang dapat melihat harga beli (buyPrice) dan total nilai aset.
 */
export function canViewFinancialValuation(role?: Role | null): boolean {
  return role === Role.SUPER_ADMIN;
}
