import { requireAdminUser } from "@/lib/access";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <div className="hero-panel p-6 sm:p-8">
        <p className="font-heading text-sm uppercase tracking-[0.35em] text-blue-600">
          Admin
        </p>
        <h1 className="mt-2 font-heading text-4xl text-slate-900 sm:text-5xl">
          Control room
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-600 sm:text-lg">
          Seed fixtures, manage the invite list, edit cutoff times, and settle official winners.
        </p>
        <AdminTabs />
      </div>
      {children}
    </div>
  );
}
