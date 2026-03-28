import { requireAuthenticatedUser } from "@/lib/access";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser();

  return children;
}
