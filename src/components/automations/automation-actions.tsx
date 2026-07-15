"use client"

import { useTransition } from "react"

import { deleteAutomation, setAutomationStatus } from "@/lib/actions/automations"
import { Button } from "@/components/ui/button"
import type { Automation } from "@/lib/dal"

export function AutomationActions({ automation }: { automation: Automation }) {
  const [pending, startTransition] = useTransition()
  const nextStatus = automation.status === "active" ? "draft" : "active"

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => setAutomationStatus(automation.id, nextStatus))}
      >
        {nextStatus === "active" ? "Activate" : "Deactivate"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete "${automation.name}"?`)) {
            startTransition(() => deleteAutomation(automation.id))
          }
        }}
      >
        Delete
      </Button>
    </div>
  )
}
