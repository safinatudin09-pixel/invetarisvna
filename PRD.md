# Product Requirements Document (PRD)
## Sistem Manajemen Inventaris (Web Inventory System)

---

### 1. Tech Stack & Arsitektur
- **Framework:** Next.js (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS + Shadcn UI + Lucide Icons
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Authentication & Authorization:** NextAuth.js / Auth.js (Credentials Email & Password + Role-Based Access Control)
- **Validasi Form & Skema:** Zod + React Hook Form
- **Visualisasi & Ekspor:** Recharts (Grafik Analitik), SheetJS / `xlsx` (Ekspor CSV/Excel)

---

### 2. User Roles & Role-Based Access Control (RBAC)

| Role | Hak Akses & Wewenang |
| :--- | :--- |
| **`SUPER_ADMIN`** | Akses penuh ke seluruh modul: CRUD semua master data (Produk, Kategori, Supplier), manajemen User & Role, pengaturan sistem, transaksi, laporan, serta melihat valuasi aset dan harga beli (`buyPrice`). |
| **`STAFF`** | Operasional gudang harian: input Barang Masuk (`IN`), Barang Keluar (`OUT`), Stock Opname (`ADJUSTMENT`), melihat daftar produk & kartu stok, serta mencetak surat jalan. **Tidak dapat** menghapus histori transaksi, mengelola user, atau mengubah pengaturan sistem. |
| **`VIEWER`** | Akses hanya baca (*read-only*) pada Dashboard, daftar stok produk, kartu stok, dan mengunduh/ekspor laporan (CSV/Excel). |

---

### 3. Skema Database (Prisma Reference)

1. **`User`**
   - `id`: String (CUID/UUID, Primary Key)
   - `name`: String
   - `email`: String (Unique)
   - `password`: String (Hashed dengan bcrypt)
   - `role`: Enum `Role` (`SUPER_ADMIN`, `STAFF`, `VIEWER`)
   - `isActive`: Boolean (Default: `true`)
   - `createdAt`, `updatedAt`: DateTime

2. **`Category`**
   - `id`: String (Primary Key)
   - `name`: String (Unique)
   - `description`: String? (Optional)
   - `createdAt`, `updatedAt`: DateTime

3. **`Supplier`**
   - `id`: String (Primary Key)
   - `name`: String
   - `contactPerson`: String?
   - `phone`: String?
   - `address`: String?
   - `createdAt`, `updatedAt`: DateTime

4. **`Product`**
   - `id`: String (Primary Key)
   - `sku`: String (Unique)
   - `barcode`: String? (Optional, Indexed)
   - `name`: String
   - `categoryId`: String (Foreign Key -> `Category.id`)
   - `unit`: String (Contoh: `Pcs`, `Box`, `Kg`, `Unit`, `Pack`)
   - `buyPrice`: Decimal / Float (Harga beli satuan)
   - `sellPrice`: Decimal / Float (Harga jual satuan)
   - `currentStock`: Int (Default: `0`)
   - `minStock`: Int (Default: `5`)
   - `imageUrl`: String? (Optional)
   - `createdAt`, `updatedAt`: DateTime

5. **`Transaction`**
   - `id`: String (Primary Key)
   - `referenceNo`: String (Unique, Auto-generate format `TRX-YYYYMMDD-XXXX`)
   - `type`: Enum `TransactionType` (`IN`, `OUT`, `ADJUSTMENT`)
   - `supplierId`: String? (Optional, digunakan untuk tipe `IN`)
   - `destination`: String? (Optional, tujuan pengiriman/divisi untuk tipe `OUT`)
   - `userId`: String (Foreign Key -> `User.id`, pembuat transaksi)
   - `notes`: String?
   - `transactionDate`: DateTime (Default: `now()`)
   - `createdAt`, `updatedAt`: DateTime

6. **`TransactionItem`**
   - `id`: String (Primary Key)
   - `transactionId`: String (Foreign Key -> `Transaction.id`, Cascade Delete)
   - `productId`: String (Foreign Key -> `Product.id`)
   - `quantity`: Int (Jumlah item dalam transaksi)
   - `unitPrice`: Decimal / Float (Harga satuan saat transaksi terjadi)

7. **`StockLog` (Audit Trail)**
   - `id`: String (Primary Key)
   - `productId`: String (Foreign Key -> `Product.id`)
   - `userId`: String (Foreign Key -> `User.id`)
   - `type`: Enum `TransactionType` (`IN`, `OUT`, `ADJUSTMENT`)
   - `changeAmount`: Int (Positif untuk penambahan, negatif untuk pengurangan)
   - `previousStock`: Int (Stok sebelum mutasi)
   - `newStock`: Int (Stok sesudah mutasi)
   - `reason`: String? (Referensi transaksi / alasan penyesuaian stok)
   - `createdAt`: DateTime (Default: `now()`)

---

### 4. Fitur Utama & Aturan Bisnis Wajib

#### 4.1. Dashboard Analitik
- **KPI Cards:**
  - **Total SKU:** Total produk terdaftar di sistem.
  - **Total Nilai Aset:** $\sum (\text{currentStock} \times \text{buyPrice})$ (Khusus `SUPER_ADMIN` untuk detail finansial penuh).
  - **Jumlah Item Low Stock:** Total produk dengan kondisi `currentStock <= minStock`.
  - **Transaksi Hari Ini:** Total aktivitas transaksi (`IN`, `OUT`, `ADJUSTMENT`) pada hari berjalan.
- **Visualisasi Grafik:** Grafik tren Barang Masuk (`IN`) vs Barang Keluar (`OUT`) dalam rentang **7 hari** dan **30 hari** terakhir.
- **Tabel Peringatan Low Stock:** Daftar produk kritis yang memerlukan *restock* segera beserta indikator status.

#### 4.2. Master Data (CRUD + Search + Filter + Pagination)
- **Manajemen Produk:** CRUD produk, filter per kategori/status stok, pencarian via SKU/Barcode/Nama.
- **Manajemen Kategori:** CRUD kategori beserta jumlah produk terkait.
- **Manajemen Supplier:** CRUD data pemasok dan histori barang masuk dari pemasok tersebut.
- **Manajemen User (`SUPER_ADMIN` Only):** Buat akun baru, ubah *role*, dan aktif/nonaktifkan akun (`isActive`).

#### 4.3. Core Engine Transaksi (ACID Compliant dengan `prisma.$transaction`)
- **Barang Masuk (`IN`):**
  - Menambah `currentStock` pada masing-masing `Product` sebesar `quantity`.
  - Mencatat riwayat pergerakan di `StockLog` (`newStock = previousStock + quantity`).
- **Barang Keluar (`OUT`):**
  - Validasi ketat di level server: `quantity` **tidak boleh melebihi** `currentStock` (`quantity <= currentStock`) untuk mencegah stok minus.
  - Mengurangi `currentStock` pada `Product` dan mencatat mutasi ke `StockLog` (`newStock = previousStock - quantity`).
  - Menyediakan fitur cetak **Surat Jalan / Bukti Barang Keluar**.
- **Stock Opname (`ADJUSTMENT`):**
  - Pengguna menginput jumlah stok fisik aktual (`physicalStock`).
  - Sistem menghitung selisih secara otomatis: `changeAmount = physicalStock - currentStock`.
  - Memperbarui `currentStock = physicalStock` dan wajib mencatat alasan penyesuaian ke `StockLog`.

#### 4.4. Kartu Stok & Laporan
- **Kartu Stok (*Stock Card*):** Halaman detail per produk yang menyajikan lini masa mutasi (`StockLog`) lengkap dengan saldo awal (`previousStock`), perubahan (`changeAmount`), saldo akhir (`newStock`), waktu, dan *user* pelaksana.
- **Ekspor Laporan:** Ekspor data stok terkini dan laporan riwayat transaksi berdasarkan rentang tanggal ke format **CSV** dan **Excel (`.xlsx`)**.
