import { notFound } from "next/navigation"
import Link from "next/link"

import { getPublicCourse, getPublicQuiz } from "@/lib/public-courses"
import { QuizTaker } from "@/components/courses/quiz-taker"

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ org: string; course: string; quiz: string }>
}) {
  const { org, course: courseSlug, quiz: quizId } = await params
  const data = await getPublicCourse(org, courseSlug)

  if (!data) {
    notFound()
  }

  const { course } = data
  const quiz = await getPublicQuiz(course.id, quizId)

  if (!quiz) {
    notFound()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link
          href={`/${org}/courses/${courseSlug}`}
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Back to {course.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
      </div>

      <QuizTaker questions={quiz.questions} />
    </div>
  )
}
