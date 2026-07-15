"use client"

import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandMenu } from "@/components/layout/command-menu"
import { OrgSwitcher } from "@/components/layout/org-switcher"
import type { OrgMembership } from "@/lib/dal"

export function DashboardTopbar({ orgs }: { orgs: OrgMembership[] }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1">
        <CommandMenu />
      </div>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="size-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <OrgSwitcher orgs={orgs} />
    </header>
  )
}
