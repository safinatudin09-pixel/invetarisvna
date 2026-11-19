# Sistem Manajemen Inventaris (Web Inventory System)

Aplikasi Web Manajemen Inventaris siap produksi (*production-ready*) berbasis **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL + Prisma ORM**, **NextAuth.js (RBAC)**, **React Hook Form + Zod**, **Recharts**, dan **SheetJS (`xlsx`)**.

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terinstal:
- **Node.js** (v18.18+ atau v20 LTS)
- **PostgreSQL** (v14+)

### 2. Konfigurasi Environment Variable
Salin atau sesuaikan file `.env` di root project dengan kredensial PostgreSQL Anda:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_inventory_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-inventory-key-change-in-production-2026"
```

### 3. Instalasi Package, Migrasi Database & Seeding Data Awal
Jalankan perintah berikut secara berurutan di terminal:

```bash
# 1. Install seluruh dependencies
npm install

# 2. Generate Prisma Client & sinkronisasi skema ke PostgreSQL
npm run db:generate
npm run db:push

# 3. Jalankan Seeding Data Awal (1 Super Admin, 1 Staff, 3 Kategori, 2 Supplier, 10 Produk)
npm run db:seed

# 4. Jalankan server development
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

---

## Akun Demo (Hasil Seed)

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | `admin@inventaris.co.id` | `Admin123!` | Akses penuh, valuasi aset (`buyPrice`), kelola user & hapus histori |
| **`STAFF`** | `staff@inventaris.co.id` | `Staff123!` | Operasional harian (Barang Masuk, Barang Keluar, Stock Opname, Cetak Surat Jalan) |
