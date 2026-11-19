import { PrismaClient, Role, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding database...");

  // 1. Bersihkan data lama dengan urutan relasi yang aman
  await prisma.stockLog.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users (1 Super Admin, 1 Staff, + opsional 1 Viewer untuk pengujian RBAC)
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const staffPassword = await bcrypt.hash("Staff123!", 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Budi Santoso (Super Admin)",
      email: "admin@inventaris.co.id",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: "Siti Rahmawati (Staff Gudang)",
      email: "staff@inventaris.co.id",
      password: staffPassword,
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log("✅ Users berhasil dibuat (1 Super Admin, 1 Staff)");

  // 3. Seed 3 Kategori
  const [catElektronik, catATK, catKemasan] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Elektronik & Perangkat Kasir",
        description: "Perangkat keras operasional toko, scanner barcode, dan printer kasir.",
      },
    }),
    prisma.category.create({
      data: {
        name: "Alat Tulis & Kebutuhan Kantor",
        description: "Perlengkapan administrasi harian kantor dan gudang.",
      },
    }),
    prisma.category.create({
      data: {
        name: "Material Kemasan & Logistik",
        description: "Bahan pengemasan paket, kardus, lakban, dan pelindung barang.",
      },
    }),
  ]);

  console.log("✅ 3 Kategori berhasil dibuat");

  // 4. Seed 2 Supplier
  const [supNusantara, supMitraJaya] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "PT Nusantara Distribusi Teknologi",
        contactPerson: "Hendra Wijaya",
        phone: "0812-3456-7890",
        address: "Jl. Industri Raya Blok C No. 12, Cikarang, Bekasi",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "CV Mitra Jaya Logistik & ATK",
        contactPerson: "Dewi Lestari",
        phone: "0813-9876-5432",
        address: "Kawasan Pergudangan Margomulyo Permai Blok H-8, Surabaya",
      },
    }),
  ]);

  console.log("✅ 2 Supplier berhasil dibuat");

  // 5. Seed 10 Produk (beberapa dibuat low stock agar fitur peringatan di Dashboard langsung terlihat)
  const productsData = [
    {
      sku: "ELK-001",
      barcode: "8991002003001",
      name: "Scanner Barcode 2D Wireless Omni",
      categoryId: catElektronik.id,
      unit: "Unit",
      buyPrice: 450000,
      sellPrice: 625000,
      currentStock: 15,
      minStock: 5,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "ELK-002",
      barcode: "8991002003002",
      name: "Printer Thermal Bluetooth 80mm Auto-Cutter",
      categoryId: catElektronik.id,
      unit: "Unit",
      buyPrice: 780000,
      sellPrice: 1050000,
      currentStock: 4, // Low stock (<= 5)
      minStock: 5,
      imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "ELK-003",
      barcode: "8991002003003",
      name: "Laci Kasir Besi (Cash Drawer) RJ11 5 Slot",
      categoryId: catElektronik.id,
      unit: "Unit",
      buyPrice: 390000,
      sellPrice: 540000,
      currentStock: 12,
      minStock: 4,
      imageUrl: null,
    },
    {
      sku: "ATK-001",
      barcode: "8991002004001",
      name: "Kertas HVS A4 80gsm (1 Dus / 5 Rim)",
      categoryId: catATK.id,
      unit: "Box",
      buyPrice: 215000,
      sellPrice: 265000,
      currentStock: 28,
      minStock: 10,
      imageUrl: null,
    },
    {
      sku: "ATK-002",
      barcode: "8991002004002",
      name: "Kertas Struk Thermal 80x80mm (Pack isi 10 Roll)",
      categoryId: catATK.id,
      unit: "Pack",
      buyPrice: 95000,
      sellPrice: 130000,
      currentStock: 8, // Low stock (<= 10)
      minStock: 10,
      imageUrl: null,
    },
    {
      sku: "ATK-003",
      barcode: "8991002004003",
      name: "Spidol Permanent Marker Hitam (Box isi 12 Pcs)",
      categoryId: catATK.id,
      unit: "Box",
      buyPrice: 72000,
      sellPrice: 98000,
      currentStock: 20,
      minStock: 5,
      imageUrl: null,
    },
    {
      sku: "KMS-001",
      barcode: "8991002005001",
      name: "Bubble Wrap Hitam 125cm x 50m Tebal",
      categoryId: catKemasan.id,
      unit: "Roll",
      buyPrice: 115000,
      sellPrice: 155000,
      currentStock: 3, // Low stock (<= 6)
      minStock: 6,
      imageUrl: null,
    },
    {
      sku: "KMS-002",
      barcode: "8991002005002",
      name: "Lakban Coklat 48mm x 90 Yard (Slop isi 6 Roll)",
      categoryId: catKemasan.id,
      unit: "Pack",
      buyPrice: 48000,
      sellPrice: 68000,
      currentStock: 45,
      minStock: 12,
      imageUrl: null,
    },
    {
      sku: "KMS-003",
      barcode: "8991002005003",
      name: "Kardus Packing Double Wall 40x30x30 cm",
      categoryId: catKemasan.id,
      unit: "Pcs",
      buyPrice: 8500,
      sellPrice: 13500,
      currentStock: 150,
      minStock: 50,
      imageUrl: null,
    },
    {
      sku: "KMS-004",
      barcode: "8991002005004",
      name: "Label Barcode Stiker Thermal 100x150mm (Roll 500 Pcs)",
      categoryId: catKemasan.id,
      unit: "Roll",
      buyPrice: 42000,
      sellPrice: 60000,
      currentStock: 5, // Low stock (<= 8)
      minStock: 8,
      imageUrl: null,
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const product = await prisma.product.create({
      data: item,
    });
    createdProducts.push(product);

    // Catat StockLog saldo awal untuk masing-masing produk
    await prisma.stockLog.create({
      data: {
        productId: product.id,
        userId: superAdmin.id,
        type: TransactionType.IN,
        changeAmount: product.currentStock,
        previousStock: 0,
        newStock: product.currentStock,
        reason: "Saldo Awal Inventaris (Initial Seed)",
      },
    });
  }

  console.log("✅ 10 Produk beserta StockLog awal berhasil dibuat");

  // 6. Contoh Transaksi Awal (1 Barang Masuk & 1 Barang Keluar) untuk histori
  const trxIn = await prisma.transaction.create({
    data: {
      referenceNo: "TRX-20261118-0001",
      type: TransactionType.IN,
      supplierId: supNusantara.id,
      userId: superAdmin.id,
      notes: "Pengadaan awal perangkat kasir dari PT Nusantara Distribusi",
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 15,
            unitPrice: createdProducts[0].buyPrice,
          },
          {
            productId: createdProducts[1].id,
            quantity: 4,
            unitPrice: createdProducts[1].buyPrice,
          },
        ],
      },
    },
  });

  const trxOut = await prisma.transaction.create({
    data: {
      referenceNo: "TRX-20261118-0002",
      type: TransactionType.OUT,
      destination: "Cabang Utama - Gudang Distribusi A",
      userId: staffUser.id,
      notes: "Permintaan perlengkapan packing harian",
      items: {
        create: [
          {
            productId: createdProducts[7].id,
            quantity: 5,
            unitPrice: createdProducts[7].sellPrice,
          },
        ],
      },
    },
  });

  console.log(`✅ Contoh transaksi (${trxIn.referenceNo}, ${trxOut.referenceNo}) berhasil dibuat`);
  console.log("🎉 Seeding selesai!");
  console.log("--------------------------------------------------");
  console.log("Akun Demo:");
  console.log("1. SUPER_ADMIN : admin@inventaris.co.id / Admin123!");
  console.log("2. STAFF       : staff@inventaris.co.id / Staff123!");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
