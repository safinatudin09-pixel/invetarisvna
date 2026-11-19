import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory } from "@/lib/rbac";
import { getAllProductsSimple } from "@/actions/product.actions";
import { getSuppliers } from "@/actions/supplier.actions";
import { StockInForm } from "@/components/transactions/StockInForm";

export const dynamic = "force-dynamic";

export default async function StockInPage() {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    redirect("/transactions");
  }

  const [products, suppliers] = await Promise.all([
    getAllProductsSimple(),
    getSuppliers(),
  ]);

  return <StockInForm products={products} suppliers={suppliers} />;
}
