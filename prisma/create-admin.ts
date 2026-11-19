import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordSimple = await bcrypt.hash("admin123", 10);
  const passwordDefault = await bcrypt.hash("Admin123!", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "nursafinatudin@inventaris.co.id" },
    update: {
      name: "Nur Safinatudin (Super Admin)",
      password: passwordSimple,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Nur Safinatudin (Super Admin)",
      email: "nursafinatudin@inventaris.co.id",
      password: passwordSimple,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      name: "Admin Utama",
      password: passwordSimple,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Admin Utama",
      email: "admin@admin.com",
      password: passwordSimple,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "admin@inventaris.co.id" },
    update: {
      password: passwordDefault,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Budi Santoso (Super Admin)",
      email: "admin@inventaris.co.id",
      password: passwordDefault,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Berhasil membuat akun Admin:");
  console.log("1.", user1.email, "| Password: admin123 | Role:", user1.role);
  console.log("2.", user2.email, "| Password: admin123 | Role:", user2.role);
  console.log("3.", user3.email, "| Password: Admin123! | Role:", user3.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
