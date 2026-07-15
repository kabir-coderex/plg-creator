"use client"

import { HelpCircle } from "lucide-react"

import { createQuiz, deleteQuiz, setQuizStatus } from "@/lib/actions/quizzes"
import type { Quiz } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function QuizzesManager({
  courseId,
  orgId,
  courseTitle,
  quizzes,
  canManage,
}: {
  courseId: string
  orgId: string
  courseTitle: string
  quizzes: Quiz[]
  canManage: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Quizzes</h2>
        {canManage && (
          <Button
            size="sm"
            onClick={async () => {
              await createQuiz(courseId, orgId, courseTitle)
            }}
          >
            Generate quiz
          </Button>
        )}
      </div>

      {quizzes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No quizzes yet — generate one to test students&apos; understanding.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{quiz.title}</p>
                <p className="text-xs text-muted-foreground">
                  {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} (placeholder)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={quiz.status === "published" ? "default" : "outline"}>{quiz.status}</Badge>
              {canManage && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await setQuizStatus(
                        quiz.id,
                        courseId,
                        quiz.status === "published" ? "draft" : "published"
                      )
                    }}
                  >
                    {quiz.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete quiz"
                    onClick={async () => {
                      if (!confirm(`Delete "${quiz.title}"?`)) return
                      await deleteQuiz(quiz.id, courseId)
                    }}
                  >
                    ×
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
