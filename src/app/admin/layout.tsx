import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/AdminSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <SidebarProvider className="dark">
      <div className="font-montserrat flex min-h-screen w-full bg-neutral-950 text-white">
        <AdminSidebar user={session.user} />
        <SidebarInset className="flex flex-1 flex-col bg-neutral-950 text-white">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-neutral-800 bg-neutral-900/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="text-neutral-200 hover:bg-neutral-800 hover:text-white" />
            <div className="mx-2 h-4 w-[1px] bg-neutral-800" />
            <span className="text-sm font-semibold text-white">
              Área Administrativa
            </span>
          </header>
          <main className="flex-1 bg-neutral-950 p-6 pb-20 text-white md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
