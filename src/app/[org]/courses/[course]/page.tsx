import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { BookOpenIcon, ClockIcon, FileTextIcon, PlayIcon, SparklesIcon, VideoIcon } from "lucide-react"

import { getPublicCourse, getPublicLessons } from "@/lib/public-courses"
import { estimateDurationMinutes, getLessonKind, getLessonKindLabel } from "@/lib/lesson-meta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from "@/components/ui/tabs"
import { CourseHeroActions } from "@/components/courses/course-hero-actions"

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ org: string; course: string }>
}) {
  const { org, course: courseSlug } = await params
  const data = await getPublicCourse(org, courseSlug)

  if (!data) {
    notFound()
  }

  const { course } = data
  const lessons = await getPublicLessons(course.id)
  const firstLessonHref = lessons.length > 0 ? `/${org}/courses/${courseSlug}/${lessons[0].id}` : undefined

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-2 p-3">
          <Badge className="gap-1 bg-black/30 text-white">
            <SparklesIcon className="size-3" />
            NEW
          </Badge>
          <CourseHeroActions />
        </div>

        {firstLessonHref && (
          <Link
            href={firstLessonHref}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Start course"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
              <PlayIcon className="size-6 fill-current" />
            </span>
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500">
              <BookOpenIcon className="size-3.5" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-emerald-500 uppercase">
              Free
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          {course.categoryName && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{course.categoryName}</Badge>
            </div>
          )}
        </div>
        {firstLessonHref && (
          <Button render={<Link href={firstLessonHref} />} className="shrink-0">
            Enroll Now
          </Button>
        )}
      </div>

      {course.description && (
        <p className="text-sm text-muted-foreground">{course.description}</p>
      )}

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTab value="description">Description</TabsTab>
          <TabsTab value="content">Content</TabsTab>
          <TabsTab value="reviews">Reviews</TabsTab>
          <TabsIndicator />
        </TabsList>

        <TabsPanel value="description">
          <p className="text-sm text-muted-foreground">
            {course.description ?? "No description yet."}
          </p>
        </TabsPanel>

        <TabsPanel value="content" className="flex flex-col gap-2">
          {lessons.length === 0 && (
            <p className="text-sm text-muted-foreground">No lessons published yet.</p>
          )}
          {lessons.map((lesson, index) => {
            const kind = getLessonKind(lesson)
            const duration = estimateDurationMinutes(lesson)
            return (
              <Link
                key={lesson.id}
                href={`/${org}/courses/${courseSlug}/${lesson.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={
                      kind === "video"
                        ? "flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-500"
                        : "flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-500/15 text-orange-500"
                    }
                  >
                    {kind === "video" ? <VideoIcon className="size-4" /> : <FileTextIcon className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {index + 1}. {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{getLessonKindLabel(kind)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {duration} min
                </div>
              </Link>
            )
          })}
        </TabsPanel>

        <TabsPanel value="reviews">
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
