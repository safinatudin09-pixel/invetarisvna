"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Lock, Mail, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (res?.error) {
      setServerError(res.error);
      toast.error(res.error);
      return;
    }

    toast.success("Berhasil masuk ke sistem inventaris!");
    router.push("/");
    router.refresh();
  };

  const fillDemoAccount = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-3">
            <Boxes className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            INVENTARIS PRO
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Sistem Manajemen Inventaris & Kontrol Stok Terpadu
          </p>
        </div>

        <Card className="border-slate-700/60 shadow-2xl">
          <CardHeader>
            <CardTitle>Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Gunakan kredensial sesuai hak akses (Role) yang terdaftar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Alamat Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@inventaris.co.id"
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk Sekarang"
                )}
              </Button>
            </form>

            {/* Quick Fill Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Akun Siap Pakai (Klik untuk isi otomatis):
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount("nursafinatudin@inventaris.co.id", "admin123")
                  }
                  className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-left hover:bg-blue-100 hover:border-blue-400 transition-colors"
                >
                  <p className="text-xs font-bold text-blue-900">
                    SUPER ADMIN UTAMA (Nur Safinatudin)
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Email: nursafinatudin@inventaris.co.id • Pass: admin123
                  </p>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fillDemoAccount("admin@inventaris.co.id", "Admin123!")
                    }
                    className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-800">SUPER_ADMIN 2</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      admin@inventaris.co.id
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      fillDemoAccount("staff@inventaris.co.id", "Staff123!")
                    }
                    className="rounded-lg border border-slate-200 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-800">STAFF GUDANG</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      staff@inventaris.co.id
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
