import { PrismaClient } from "@prisma/client";

const SUPABASE_POOLER_URL =
  "postgresql://inventory_app.qakmyyomjudakhnmortu:InvAppSupabase2026_SecurePassword@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5";

function getEffectiveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  // Jika DATABASE_URL kosong atau masih mengarah ke 127.0.0.1/localhost, gunakan Supabase Cloud Pooler
  if (!envUrl || envUrl.includes("127.0.0.1") || envUrl.includes("localhost")) {
    return SUPABASE_POOLER_URL;
  }
  return envUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getEffectiveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
