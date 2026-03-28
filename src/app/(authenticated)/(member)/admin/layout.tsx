import { requireGlobalAdminUser } from "@/lib/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGlobalAdminUser();
  return children;
}
