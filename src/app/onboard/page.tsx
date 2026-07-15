"use client"

import { useActionState } from "react"

import { createOrganization } from "@/lib/actions/organizations"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function OnboardPage() {
  const [state, action, pending] = useActionState(createOrganization, undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set up your business</CardTitle>
        <CardDescription>
          What&apos;s the name of your creator business? You can change this later.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Business name
            </label>
            <Input id="name" name="name" placeholder="Jane's Coaching Co." required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Continue"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
