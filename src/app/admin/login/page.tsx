import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kirish — Navqiron admin",
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");
  return <LoginForm />;
}
