import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";
import { getTransactionById } from "@/actions/transaction.actions";
import { formatDate, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PrintTriggerButton } from "@/components/transactions/PrintTriggerButton";

export const dynamic = "force-dynamic";

interface PrintTransactionPageProps {
  params: { id: string };
}

export default async function PrintTransactionPage({
  params,
}: PrintTransactionPageProps) {
  const trx = await getTransactionById(params.id);

  if (!trx) {
    notFound();
  }

  const docTitle =
    trx.type === "OUT"
      ? "SURAT JALAN PENGELUARAN BARANG"
      : trx.type === "IN"
      ? "BUKTI PENERIMAAN BARANG MASUK"
      : "BERITA ACARA STOCK OPNAME";

  const totalQty = trx.items.reduce((acc, i) => acc + i.quantity, 0);
  const grandTotal = trx.items.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <div className="space-y-6">
      {/* Toolbar (Disembunyikan saat mode print) */}
      <div className="no-print flex items-center justify-between">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Transaksi
          </Button>
        </Link>
        <PrintTriggerButton />
      </div>

      {/* Dokumen Surat Jalan / Bukti Transaksi */}
      <div className="rounded-xl border border-slate-300 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        {/* Kop Surat */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Boxes className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                PT INVENTARIS NUSANTARA LOGISTIK
              </h1>
              <p className="text-xs text-slate-600">
                Kawasan Pergudangan Terpadu Blok A1 • Telp: (021) 555-0199
              </p>
              <p className="text-xs text-slate-500">
                Sistem Manajemen Inventaris Terpadu (WMS)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
              {docTitle}
            </h2>
            <p className="font-mono text-sm font-bold text-blue-700 mt-1">
              No: {trx.referenceNo}
            </p>
            <p className="text-xs text-slate-500">
              Tanggal: {formatDate(trx.transactionDate, "dd MMMM yyyy, HH:mm")}
            </p>
          </div>
        </div>

        {/* Informasi Pihak Terkait */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              {trx.type === "IN"
                ? "Diterima Dari Supplier:"
                : trx.type === "OUT"
                ? "Dikirim Kepada / Tujuan:"
                : "Unit Pelaksana Opname:"}
            </p>
            {trx.type === "IN" && trx.supplier ? (
              <div className="mt-1 space-y-0.5">
                <p className="font-bold text-slate-900">{trx.supplier.name}</p>
                {trx.supplier.contactPerson && (
                  <p className="text-xs text-slate-600">
                    UP: {trx.supplier.contactPerson} ({trx.supplier.phone})
                  </p>
                )}
                {trx.supplier.address && (
                  <p className="text-xs text-slate-600">{trx.supplier.address}</p>
                )}
              </div>
            ) : trx.type === "OUT" ? (
              <p className="mt-1 font-bold text-slate-900">
                {trx.destination || "-"}
              </p>
            ) : (
              <p className="mt-1 font-bold text-slate-900">
                Divisi Audit & Kontrol Gudang Internal
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Informasi Petugas & Catatan:
            </p>
            <p className="mt-1 text-slate-800">
              Petugas Gudang: <strong>{trx.user.name}</strong> ({trx.user.role})
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Catatan: {trx.notes || "-"}
            </p>
          </div>
        </div>

        {/* Tabel Rincian Barang */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs font-bold uppercase text-slate-700">
                <th className="border border-slate-300 px-3 py-2.5 w-12 text-center">
                  No
                </th>
                <th className="border border-slate-300 px-3 py-2.5">Kode SKU</th>
                <th className="border border-slate-300 px-3 py-2.5">
                  Nama Barang / Deskripsi
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-right">
                  Kuantitas
                </th>
                <th className="border border-slate-300 px-3 py-2.5">Satuan</th>
                <th className="border border-slate-300 px-3 py-2.5 text-right">
                  Harga Satuan
                </th>
                <th className="border border-slate-300 px-3 py-2.5 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {trx.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 font-mono text-xs font-semibold">
                    {item.sku}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 font-medium text-slate-900">
                    {item.productName}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {item.quantity}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    {item.unit}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-semibold">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td
                  colSpan={3}
                  className="border border-slate-300 px-3 py-2.5 text-right"
                >
                  TOTAL KESELURUHAN
                </td>
                <td className="border border-slate-300 px-3 py-2.5 text-right">
                  {totalQty}
                </td>
                <td className="border border-slate-300 px-3 py-2.5">Item</td>
                <td className="border border-slate-300 px-3 py-2.5"></td>
                <td className="border border-slate-300 px-3 py-2.5 text-right text-slate-900">
                  {formatRupiah(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Kolom Tanda Tangan */}
        <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs text-slate-700">
          <div>
            <p className="font-semibold">Dibuat / Diserahkan Oleh,</p>
            <div className="h-20" />
            <p className="font-bold underline">{trx.user.name}</p>
            <p className="text-slate-500">Petugas Gudang</p>
          </div>

          <div>
            <p className="font-semibold">Diperiksa Oleh,</p>
            <div className="h-20" />
            <p className="font-bold underline">( ................................. )</p>
            <p className="text-slate-500">Kepala Gudang / Logistik</p>
          </div>

          <div>
            <p className="font-semibold">Diterima Oleh,</p>
            <div className="h-20" />
            <p className="font-bold underline">( ................................. )</p>
            <p className="text-slate-500">Penerima / Pengemudi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
