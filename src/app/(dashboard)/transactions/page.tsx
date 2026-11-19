import { getTransactions } from "@/actions/transaction.actions";
import { getCurrentUser } from "@/lib/auth";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: {
    search?: string;
    type?: "ALL" | "IN" | "OUT" | "ADJUSTMENT";
    startDate?: string;
    endDate?: string;
    page?: string;
  };
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const page = Number(searchParams.page ?? "1") || 1;
  const search = searchParams.search ?? "";
  const type = searchParams.type ?? "ALL";
  const startDate = searchParams.startDate ?? "";
  const endDate = searchParams.endDate ?? "";

  const data = await getTransactions({
    search,
    type,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize: 10,
  });

  return (
    <TransactionsClient
      transactions={data.transactions}
      totalCount={data.totalCount}
      totalPages={data.totalPages}
      currentPage={data.currentPage}
      userRole={user.role}
      currentSearch={search}
      currentType={type}
      currentStartDate={startDate}
      currentEndDate={endDate}
    />
  );
}
