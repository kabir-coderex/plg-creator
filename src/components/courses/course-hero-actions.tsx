"use client"

import { useState } from "react"
import { BookmarkIcon, Share2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CourseHeroActions() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={saved ? "Remove bookmark" : "Bookmark course"}
        className="bg-black/30 text-white hover:bg-black/50 hover:text-white"
        onClick={() => setSaved((value) => !value)}
      >
        <BookmarkIcon className={cn(saved && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Share course"
        className="bg-black/30 text-white hover:bg-black/50 hover:text-white"
        onClick={() => {
          if (typeof window !== "undefined") {
            navigator.clipboard?.writeText(window.location.href)
          }
        }}
      >
        <Share2Icon />
      </Button>
    </div>
  )
}
