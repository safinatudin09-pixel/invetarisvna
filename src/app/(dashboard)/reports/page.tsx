import { getCurrentUser } from "@/lib/auth";
import { canViewFinancialValuation } from "@/lib/rbac";
import { getAllProductsSimple } from "@/actions/product.actions";
import { getTransactions } from "@/actions/transaction.actions";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, trxData] = await Promise.all([
    getAllProductsSimple(),
    getTransactions({ page: 1, pageSize: 200 }),
  ]);

  return (
    <ReportsClient
      products={products}
      transactions={trxData.transactions}
      canViewBuyPrice={canViewFinancialValuation(user.role)}
    />
  );
}
