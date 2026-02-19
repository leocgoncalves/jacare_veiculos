import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser, isAdminRole, type CurrentUser } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

const PRINCIPAL_ADMIN_EMAIL = "leo_cardoso1003@hotmail.com";

export default async function AdminPage() {
  const user: CurrentUser | null = await getCurrentUser();
  if (!user || !isAdminRole(user.role) || !user.isActive) {
    redirect("/admin/login");
  }

  const isPrincipalAdmin =
    user.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL &&
    (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);

  return (
    <AdminDashboard
      adminName={user.name}
      adminRole={user.role}
      adminId={user.id}
      adminEmail={user.email}
      isSuperAdmin={isPrincipalAdmin || user.role === UserRole.SUPER_ADMIN}
    />
  );
}
