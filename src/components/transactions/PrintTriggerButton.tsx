"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintTriggerButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Cetak Surat Jalan / Bukti Transaksi
    </Button>
  );
}
