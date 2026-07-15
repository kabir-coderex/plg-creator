"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

function storageKey(lessonId: string) {
  return `lesson-notes:${lessonId}`
}

export function LessonNotesSheet({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(() =>
    typeof window === "undefined" ? "" : (window.localStorage.getItem(storageKey(lessonId)) ?? "")
  )

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PencilIcon />
        Notes
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Notes</SheetTitle>
            <SheetDescription>
              Saved to this browser only — not synced anywhere yet.
            </SheetDescription>
          </SheetHeader>
          <Textarea
            value={notes}
            onChange={(event) => {
              const value = event.target.value
              setNotes(value)
              window.localStorage.setItem(storageKey(lessonId), value)
            }}
            placeholder="Write a note for this lesson…"
            className="mx-4 min-h-40 flex-1"
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
