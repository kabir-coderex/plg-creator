import { redirect } from "next/navigation"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardTopbar } from "@/components/layout/dashboard-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserMemberships } from "@/lib/dal"

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgs = await getUserMemberships()

  if (orgs.length === 0) {
    redirect("/onboard")
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardTopbar orgs={orgs} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
