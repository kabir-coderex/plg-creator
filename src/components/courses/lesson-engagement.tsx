"use client"

import { useState } from "react"
import { MessageSquareIcon, SparklesIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function AskAiButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="sm" disabled>
            <SparklesIcon />
            Ask AI
          </Button>
        }
      />
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  )
}

export function DiscussButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="sm" disabled>
            <MessageSquareIcon />
            Discuss
          </Button>
        }
      />
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  )
}

export function HelpfulButton() {
  const [marked, setMarked] = useState(false)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setMarked((value) => !value)}
      className={cn(marked && "text-emerald-500")}
    >
      <ThumbsUpIcon className={cn(marked && "fill-current")} />
      Helpful
    </Button>
  )
}
