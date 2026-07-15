"use client"

import { useTransition } from "react"

import { deleteFunnel, setFunnelStatus } from "@/lib/actions/funnels"
import { Button } from "@/components/ui/button"
import type { Funnel } from "@/lib/dal"

export function FunnelActions({ funnel }: { funnel: Funnel }) {
  const [pending, startTransition] = useTransition()
  const nextStatus = funnel.status === "published" ? "draft" : "published"

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => setFunnelStatus(funnel.id, nextStatus))}
      >
        {nextStatus === "published" ? "Publish" : "Unpublish"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete "${funnel.name}"?`)) {
            startTransition(() => deleteFunnel(funnel.id))
          }
        }}
      >
        Delete
      </Button>
    </div>
  )
}
