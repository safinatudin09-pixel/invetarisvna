import { getCategories } from "@/actions/category.actions";
import { getCurrentUser } from "@/lib/auth";
import { CategoriesClient } from "@/components/master/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const categories = await getCategories();

  return <CategoriesClient categories={categories} userRole={user.role} />;
}
