"use client"

import { useActionState } from "react"

import { createCategory, type CategoryFormState } from "@/lib/actions/courses"
import type { Category } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CategoryQuickAdd({ orgId, categories }: { orgId: string; categories: Category[] }) {
  const createWithOrg = createCategory.bind(null, orgId)
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(createWithOrg, undefined)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.length === 0 && (
          <span className="text-sm text-muted-foreground">No categories yet.</span>
        )}
        {categories.map((category) => (
          <Badge key={category.id} variant="outline">
            {category.name}
          </Badge>
        ))}
      </div>
      <form action={action} className="flex gap-2">
        <Input name="name" placeholder="New category name" className="max-w-56" required />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Adding..." : "Add category"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  )
}
