"use client"

import { useActionState } from "react"

import type { CheckoutFormState } from "@/lib/actions/funnels"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CheckoutForm({
  action,
  ctaText,
}: {
  action: (state: CheckoutFormState, formData: FormData) => Promise<CheckoutFormState>
  ctaText: string
}) {
  const [state, formAction, pending] = useActionState<CheckoutFormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="customer_name" className="text-sm font-medium">
          Name
        </label>
        <Input id="customer_name" name="customer_name" placeholder="Jane Doe" required />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="customer_email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="customer_email"
          name="customer_email"
          type="email"
          placeholder="jane@example.com"
          required
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <p className="text-xs text-muted-foreground">
        Demo checkout — no payment is collected and no real charge is made.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Processing..." : ctaText}
      </Button>
    </form>
  )
}
