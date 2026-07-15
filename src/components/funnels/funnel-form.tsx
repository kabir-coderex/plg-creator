"use client"

import { useActionState } from "react"

import type { FunnelFormState } from "@/lib/actions/funnels"
import type { Course, Funnel } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const FIELD_CLASSES =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export function FunnelForm({
  action,
  courses,
  funnel,
  submitLabel,
}: {
  action: (state: FunnelFormState, formData: FormData) => Promise<FunnelFormState>
  courses: Course[]
  funnel?: Funnel
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState<FunnelFormState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Funnel name
        </label>
        <Input id="name" name="name" defaultValue={funnel?.name} placeholder="Baking launch" required />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="course_id" className="text-sm font-medium">
          Course
        </label>
        <select
          id="course_id"
          name="course_id"
          defaultValue={funnel?.courseId ?? ""}
          className={FIELD_CLASSES}
          required
        >
          <option value="" disabled>
            Choose a course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="headline" className="text-sm font-medium">
          Landing page headline
        </label>
        <Input
          id="headline"
          name="headline"
          defaultValue={funnel?.headline}
          placeholder="Learn to bake like a pro"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="subheadline" className="text-sm font-medium">
          Subheadline
        </label>
        <Input
          id="subheadline"
          name="subheadline"
          defaultValue={funnel?.subheadline ?? ""}
          placeholder="A step-by-step course for total beginners"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={funnel?.description ?? ""}
          placeholder="What's included, who it's for, why it works..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="price_label" className="text-sm font-medium">
            Price label
          </label>
          <Input
            id="price_label"
            name="price_label"
            defaultValue={funnel?.priceLabel ?? "$0"}
            placeholder="$97"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="cta_text" className="text-sm font-medium">
            Button text
          </label>
          <Input
            id="cta_text"
            name="cta_text"
            defaultValue={funnel?.ctaText ?? "Get instant access"}
            placeholder="Get instant access"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="thank_you_message" className="text-sm font-medium">
          Thank-you page message
        </label>
        <Textarea
          id="thank_you_message"
          name="thank_you_message"
          defaultValue={funnel?.thankYouMessage ?? ""}
          placeholder="Thanks for your order! Check your email for access details."
          rows={3}
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
