"use client"

import { useActionState, useState } from "react"
import { GripVertical, Pencil, PlayCircle } from "lucide-react"

import { createLesson, deleteLesson, updateLesson, type LessonFormState } from "@/lib/actions/lessons"
import type { Lesson } from "@/lib/dal"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function LessonFields({ lesson }: { lesson?: Lesson }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Title</label>
        <Input name="title" defaultValue={lesson?.title} placeholder="Lesson title" required />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Content</label>
        <Textarea name="content" defaultValue={lesson?.content ?? ""} placeholder="Lesson notes" rows={4} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Video URL</label>
        <Input name="video_url" defaultValue={lesson?.videoUrl ?? ""} placeholder="https://..." />
      </div>
    </>
  )
}

function AddLessonDialog({ courseId, orgId }: { courseId: string; orgId: string }) {
  const [open, setOpen] = useState(false)
  const createWithIds = createLesson.bind(null, courseId, orgId)
  const [state, action, pending] = useActionState<LessonFormState, FormData>(createWithIds, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>Add lesson</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add lesson</DialogTitle>
          <DialogDescription>Basic fields — title, content, and an optional video link.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <LessonFields />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Adding..." : "Add lesson"}
          </Button>
        </form>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

function EditLessonDialog({ lesson, courseId }: { lesson: Lesson; courseId: string }) {
  const [open, setOpen] = useState(false)
  const updateWithIds = updateLesson.bind(null, lesson.id, courseId)
  const [state, action, pending] = useActionState<LessonFormState, FormData>(updateWithIds, undefined)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
        aria-label="Edit lesson"
      >
        <Pencil className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lesson</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <LessonFields lesson={lesson} />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

export function LessonsManager({
  courseId,
  orgId,
  lessons,
  canManage,
}: {
  courseId: string
  orgId: string
  lessons: Lesson[]
  canManage: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lessons</h2>
        {canManage && <AddLessonDialog courseId={courseId} orgId={orgId} />}
      </div>

      {lessons.length === 0 && (
        <p className="text-sm text-muted-foreground">No lessons yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{lesson.title}</p>
                {lesson.videoUrl && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PlayCircle className="size-3" /> {lesson.videoUrl}
                  </p>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-1">
                <EditLessonDialog lesson={lesson} courseId={courseId} />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete lesson"
                  onClick={async () => {
                    if (!confirm(`Delete "${lesson.title}"?`)) return
                    await deleteLesson(lesson.id, courseId)
                  }}
                >
                  ×
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
