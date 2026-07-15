"use client"

import { useActionState } from "react"

import type { AutomationFormState } from "@/lib/actions/automations"
import type { Automation, Funnel } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const FIELD_CLASSES =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export function AutomationForm({
  action,
  funnels,
  automation,
  submitLabel,
}: {
  action: (state: AutomationFormState, formData: FormData) => Promise<AutomationFormState>
  funnels: Funnel[]
  automation?: Automation
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState<AutomationFormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Automation name
        </label>
        <Input id="name" name="name" defaultValue={automation?.name} placeholder="Tag new buyers" required />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Trigger</label>
        <p className="text-sm text-muted-foreground">Funnel purchased</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="funnel_id" className="text-sm font-medium">
          Funnel
        </label>
        <select
          id="funnel_id"
          name="funnel_id"
          defaultValue={automation?.triggerConfig.funnel_id ?? ""}
          className={FIELD_CLASSES}
        >
          <option value="">Any funnel</option>
          {funnels.map((funnel) => (
            <option key={funnel.id} value={funnel.id}>
              {funnel.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Action</label>
        <p className="text-sm text-muted-foreground">Tag contact</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tag" className="text-sm font-medium">
          Tag
        </label>
        <Input
          id="tag"
          name="tag"
          defaultValue={automation?.actionConfig.tag ?? "customer"}
          placeholder="buyer"
          required
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
