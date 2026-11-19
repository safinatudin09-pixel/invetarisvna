import { getProducts } from "@/actions/product.actions";
import { getCategories } from "@/actions/category.actions";
import { getCurrentUser } from "@/lib/auth";
import { ProductsClient } from "@/components/products/ProductsClient";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: {
    search?: string;
    categoryId?: string;
    stockStatus?: "ALL" | "LOW" | "SAFE";
    page?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const page = Number(searchParams.page ?? "1") || 1;
  const search = searchParams.search ?? "";
  const categoryId = searchParams.categoryId ?? "ALL";
  const stockStatus = searchParams.stockStatus ?? "ALL";

  const [productData, categories] = await Promise.all([
    getProducts({
      search,
      categoryId,
      stockStatus,
      page,
      pageSize: 10,
    }),
    getCategories(),
  ]);

  return (
    <ProductsClient
      initialProducts={productData.products}
      categories={categories}
      totalCount={productData.totalCount}
      totalPages={productData.totalPages}
      currentPage={productData.currentPage}
      canViewBuyPrice={productData.canViewBuyPrice}
      userRole={user.role}
      currentSearch={search}
      currentCategory={categoryId}
      currentStockStatus={stockStatus}
    />
  );
}
