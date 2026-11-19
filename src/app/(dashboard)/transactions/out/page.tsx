import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canMutateInventory } from "@/lib/rbac";
import { getAllProductsSimple } from "@/actions/product.actions";
import { StockOutForm } from "@/components/transactions/StockOutForm";

export const dynamic = "force-dynamic";

export default async function StockOutPage() {
  const user = await getCurrentUser();
  if (!user || !canMutateInventory(user.role)) {
    redirect("/transactions");
  }

  const products = await getAllProductsSimple();

  return <StockOutForm products={products} />;
}
