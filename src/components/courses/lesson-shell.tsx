"use client"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, BookmarkIcon, PanelLeftIcon, Share2Icon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/courses/theme-toggle"
import { cn } from "@/lib/utils"

export function LessonShell({
  backHref,
  courseTitle,
  sidebar,
  children,
}: {
  backHref: string
  courseTitle: string
  sidebar: ReactNode
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "w-72 shrink-0 overflow-y-auto border-r",
          !sidebarOpen && "hidden"
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" render={<Link href={backHref} />} aria-label="Back to course">
              <ArrowLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle contents sidebar"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              <PanelLeftIcon />
            </Button>
            <p className="truncate text-sm font-medium">{courseTitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Tooltip>
              <TooltipTrigger render={<Badge variant="outline" className="rounded-full px-2">50</Badge>} />
              <TooltipContent>Coming soon: XP points</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge variant="outline" className="gap-1">
                    <StarIcon className="size-3" />0
                  </Badge>
                }
              />
              <TooltipContent>Coming soon: ratings</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={saved ? "Remove bookmark" : "Bookmark lesson"}
              onClick={() => setSaved((value) => !value)}
            >
              <BookmarkIcon className={cn(saved && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Share lesson"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
              }}
            >
              <Share2Icon />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
