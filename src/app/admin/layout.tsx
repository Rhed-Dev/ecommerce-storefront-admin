import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = { title: "Admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
