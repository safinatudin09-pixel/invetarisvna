import { Prisma } from "@prisma/client";
import { format } from "date-fns";

/**
 * Menghasilkan nomor referensi transaksi otomatis dengan format:
 * TRX-YYYYMMDD-XXXX (contoh: TRX-20261118-0001)
 * Dapat dijalankan di dalam transaksi Prisma (tx) untuk menjamin keunikan.
 */
export async function generateTransactionReferenceNo(
  tx: Prisma.TransactionClient
): Promise<string> {
  const datePart = format(new Date(), "yyyyMMdd");
  const prefix = `TRX-${datePart}-`;

  const lastTransaction = await tx.transaction.findFirst({
    where: {
      referenceNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      referenceNo: "desc",
    },
    select: {
      referenceNo: true,
    },
  });

  let nextSequence = 1;
  if (lastTransaction?.referenceNo) {
    const parts = lastTransaction.referenceNo.split("-");
    const lastSeqStr = parts[2];
    const parsedSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(parsedSeq)) {
      nextSequence = parsedSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSequence}`;
}
