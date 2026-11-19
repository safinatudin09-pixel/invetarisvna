"use client";

import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/rbac";

interface TopbarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

export function Topbar({ user }: TopbarProps) {
  const roleBadgeVariant =
    user.role === "SUPER_ADMIN"
      ? "default"
      : user.role === "STAFF"
      ? "success"
      : "warning";

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-xs">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-medium text-slate-500">
          Mode Akses Aktif:
        </span>
        <Badge variant={roleBadgeVariant}>{ROLE_LABELS[user.role]}</Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <UserIcon className="h-4 w-4" />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
