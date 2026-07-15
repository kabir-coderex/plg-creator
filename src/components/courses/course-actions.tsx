"use client"

import { useTransition } from "react"

import { deleteCourse, setCourseStatus } from "@/lib/actions/courses"
import { Button } from "@/components/ui/button"
import type { Course } from "@/lib/dal"

export function CourseActions({ course }: { course: Course }) {
  const [pending, startTransition] = useTransition()
  const nextStatus = course.status === "published" ? "draft" : "published"

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => setCourseStatus(course.id, nextStatus))}
      >
        {nextStatus === "published" ? "Publish" : "Unpublish"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete "${course.title}"? This also deletes its lessons.`)) {
            startTransition(() => deleteCourse(course.id))
          }
        }}
      >
        Delete
      </Button>
    </div>
  )
}
