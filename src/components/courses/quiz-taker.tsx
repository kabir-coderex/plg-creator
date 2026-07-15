"use client"

import { useState } from "react"

import type { QuizQuestion } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function QuizTaker({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = questions.reduce(
    (total, q, i) => total + (answers[i] === q.correct_answer ? 1 : 0),
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {questions.map((q, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="text-sm font-medium">
            {i + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((option) => {
              const selected = answers[i] === option
              const isCorrect = option === q.correct_answer
              return (
                <button
                  key={option}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [i]: option }))}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    selected && !submitted && "border-primary bg-primary/5",
                    submitted && isCorrect && "border-emerald-500 bg-emerald-500/10",
                    submitted && selected && !isCorrect && "border-destructive bg-destructive/10"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {submitted ? (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <p className="text-sm font-medium">
            Score: {score} / {questions.length}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSubmitted(false)
              setAnswers({})
            }}
          >
            Retake
          </Button>
        </div>
      ) : (
        <Button
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setSubmitted(true)}
          className="self-start"
        >
          Submit
        </Button>
      )}
    </div>
  )
}
