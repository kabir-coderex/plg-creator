"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import { signOut } from "@/lib/actions/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Org = { id: string; name: string; slug: string; role: string }

export function OrgSwitcher({ orgs }: { orgs: Org[] }) {
  const current = orgs[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 max-w-48 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-muted">
        <span className="truncate">{current?.name ?? "No organization"}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id}>
            <span className="truncate">{org.name}</span>
            <span className="ml-auto text-xs text-muted-foreground capitalize">{org.role}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
