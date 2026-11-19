import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "INVENTARIS PRO | Sistem Manajemen Inventaris Gudang",
  description:
    "Aplikasi Web Manajemen Inventaris Berstandar Enterprise dengan Next.js App Router, Prisma ORM, dan RBAC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
