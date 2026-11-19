import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

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
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
