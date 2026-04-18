import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  title: "DentFlow KZ - Admin Security",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
