import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { getUsers } from "@/actions/user.actions";
import { UsersClient } from "@/components/master/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    redirect("/");
  }

  const users = await getUsers();

  return <UsersClient users={users} />;
}
