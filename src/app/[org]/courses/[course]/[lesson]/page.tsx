import { notFound } from "next/navigation"
import Link from "next/link"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  HelpCircleIcon,
  VideoIcon,
} from "lucide-react"

import { getPublicCourse, getPublicLessons, getPublicQuizzes } from "@/lib/public-courses"
import { estimateDurationMinutes, getLessonKind, getLessonKindLabel } from "@/lib/lesson-meta"
import { Badge } from "@/components/ui/badge"
import { LessonVideo } from "@/components/courses/lesson-video"
import { LessonShell } from "@/components/courses/lesson-shell"
import { LessonNotesSheet } from "@/components/courses/lesson-notes-sheet"
import { AskAiButton, DiscussButton, HelpfulButton } from "@/components/courses/lesson-engagement"
import { cn } from "@/lib/utils"

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ org: string; course: string; lesson: string }>
}) {
  const { org, course: courseSlug, lesson: lessonId } = await params
  const data = await getPublicCourse(org, courseSlug)

  if (!data) {
    notFound()
  }

  const { course } = data
  const lessons = await getPublicLessons(course.id)
  const quizzes = await getPublicQuizzes(course.id)
  const lessonIndex = lessons.findIndex((item) => item.id === lessonId)

  if (lessonIndex === -1) {
    notFound()
  }

  const lesson = lessons[lessonIndex]
  const kind = getLessonKind(lesson)
  const duration = estimateDurationMinutes(lesson)
  // No progress tracking yet — treat the current lesson and everything before
  // it as watched so the sidebar/badges have something meaningful to show.
  const isCompleted = true

  return (
    <LessonShell
      backHref={`/${org}/courses/${courseSlug}`}
      courseTitle={course.title}
      sidebar={
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-muted">
              <BookOpenIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Contents</p>
              <p className="text-xs text-muted-foreground">Browse the course contents</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {lessons.map((item, index) => {
              const itemKind = getLessonKind(item)
              const itemDuration = estimateDurationMinutes(item)
              const active = index === lessonIndex
              const done = index <= lessonIndex
              return (
                <Link
                  key={item.id}
                  href={`/${org}/courses/${courseSlug}/${item.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2 py-2 transition-colors hover:bg-muted",
                    active && "border-foreground bg-muted"
                  )}
                >
                  <span
                    className={
                      itemKind === "video"
                        ? "flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-500"
                        : "flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-500/15 text-orange-500"
                    }
                  >
                    {itemKind === "video" ? <VideoIcon className="size-3.5" /> : <FileTextIcon className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {index + 1}. {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getLessonKindLabel(itemKind)} · {itemDuration} minutes
                    </p>
                  </div>
                  {done && <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />}
                </Link>
              )
            })}
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/${org}/courses/${courseSlug}/quiz/${quiz.id}`}
                className="flex items-center gap-2 rounded-lg border-l-2 border-transparent px-2 py-2 transition-colors hover:bg-muted"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-500">
                  <HelpCircleIcon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">Quiz · {quiz.questionCount} questions</p>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={
                kind === "video"
                  ? "flex size-9 items-center justify-center rounded-md bg-blue-500/15 text-blue-500"
                  : "flex size-9 items-center justify-center rounded-md bg-orange-500/15 text-orange-500"
              }
            >
              {kind === "video" ? <VideoIcon className="size-4.5" /> : <FileTextIcon className="size-4.5" />}
            </span>
            <div>
              <h1 className="text-lg font-semibold">
                {lessonIndex + 1}. {lesson.title}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {duration} minutes
                </span>
                <Badge variant="outline">{getLessonKindLabel(kind)}</Badge>
                {isCompleted && (
                  <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2Icon className="size-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AskAiButton />
            <LessonNotesSheet lessonId={lesson.id} />
          </div>
        </div>

        {lesson.videoUrl ? (
          <LessonVideo url={lesson.videoUrl} />
        ) : (
          <div className="rounded-lg border bg-muted/30 p-6">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {lesson.content ?? "No content for this lesson yet."}
            </p>
          </div>
        )}

        {lesson.videoUrl && lesson.content && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lesson.content}</p>
        )}

        <div className="flex items-center gap-1">
          <HelpfulButton />
          <DiscussButton />
        </div>
      </div>
    </LessonShell>
  )
}
