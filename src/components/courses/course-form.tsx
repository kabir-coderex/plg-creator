"use client"

import { useActionState } from "react"
import Image from "next/image"

import type { CourseFormState } from "@/lib/actions/courses"
import type { Category, Course } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const FIELD_CLASSES =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export function CourseForm({
  action,
  categories,
  course,
  submitLabel,
}: {
  action: (state: CourseFormState, formData: FormData) => Promise<CourseFormState>
  categories: Category[]
  course?: Course
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState<CourseFormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input id="title" name="title" defaultValue={course?.title} placeholder="Intro to Baking" required />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category_id" className="text-sm font-medium">
          Category
        </label>
        <select id="category_id" name="category_id" defaultValue={course?.categoryId ?? ""} className={FIELD_CLASSES}>
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={course?.description ?? ""}
          placeholder="What will students learn?"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="thumbnail" className="text-sm font-medium">
          Thumbnail
        </label>
        {course?.thumbnailUrl && (
          <Image
            src={course.thumbnailUrl}
            alt=""
            width={160}
            height={90}
            unoptimized
            className="rounded-lg border object-cover"
          />
        )}
        <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
