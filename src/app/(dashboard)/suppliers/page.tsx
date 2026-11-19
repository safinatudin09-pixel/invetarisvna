import { getSuppliers } from "@/actions/supplier.actions";
import { getCurrentUser } from "@/lib/auth";
import { SuppliersClient } from "@/components/master/SuppliersClient";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const suppliers = await getSuppliers();

  return <SuppliersClient suppliers={suppliers} userRole={user.role} />;
}
