import { getSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminHomePage() {
  const session = await getSession();
  return <AdminDashboard name={session?.name ?? "Administrator"} />;
}
