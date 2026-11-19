"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  FileSpreadsheet,
  Users,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canMutateInventory, isSuperAdmin } from "@/lib/rbac";

interface SidebarProps {
  userRole: Role;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const canMutate = canMutateInventory(userRole);
  const isAdmin = isSuperAdmin(userRole);

  const navGroups = [
    {
      group: "Ringkasan",
      items: [
        {
          label: "Dashboard Analitik",
          href: "/",
          icon: LayoutDashboard,
          show: true,
        },
      ],
    },
    {
      group: "Master Data",
      items: [
        {
          label: "Master Produk & Stok",
          href: "/products",
          icon: Package,
          show: true,
        },
        {
          label: "Kategori Barang",
          href: "/categories",
          icon: Tags,
          show: true,
        },
        {
          label: "Data Supplier",
          href: "/suppliers",
          icon: Truck,
          show: true,
        },
      ],
    },
    {
      group: "Operasional Gudang",
      items: [
        {
          label: "Riwayat Transaksi",
          href: "/transactions",
          icon: History,
          show: true,
        },
        {
          label: "Barang Masuk (IN)",
          href: "/transactions/in",
          icon: ArrowDownLeft,
          show: canMutate,
        },
        {
          label: "Barang Keluar (OUT)",
          href: "/transactions/out",
          icon: ArrowUpRight,
          show: canMutate,
        },
        {
          label: "Stock Opname",
          href: "/transactions/adjustment",
          icon: ClipboardCheck,
          show: canMutate,
        },
      ],
    },
    {
      group: "Laporan & Sistem",
      items: [
        {
          label: "Pusat Laporan & Ekspor",
          href: "/reports",
          icon: FileSpreadsheet,
          show: true,
        },
        {
          label: "Manajemen User (RBAC)",
          href: "/users",
          icon: Users,
          show: isAdmin,
        },
      ],
    },
  ];

  return (
    <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">INVENTARIS PRO</p>
          <p className="text-[11px] text-slate-400">Enterprise WMS System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.group}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        (item.href !== "/transactions" &&
                          pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <p className="font-medium text-slate-300">ACID Transaction Engine</p>
        <p className="mt-0.5">Prisma ORM + NextAuth RBAC</p>
      </div>
    </aside>
  );
}
