import { notFound } from "next/navigation"
import Image from "next/image"

import { getPublicCourse, getPublicLessons } from "@/lib/public-courses"
import { Badge } from "@/components/ui/badge"
import { LessonVideo } from "@/components/courses/lesson-video"

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

  const { organization, course } = data
  const lessons = await getPublicLessons(course.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">{organization.name}</p>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        {course.categoryName && <Badge variant="secondary">{course.categoryName}</Badge>}
        {course.thumbnailUrl && (
          <Image
            src={course.thumbnailUrl}
            alt=""
            width={768}
            height={432}
            unoptimized
            className="w-full rounded-lg border object-cover"
          />
        )}
        {course.description && <p className="text-muted-foreground">{course.description}</p>}
      </div>

      <div className="flex flex-col gap-8">
        {lessons.length === 0 && (
          <p className="text-sm text-muted-foreground">No lessons published yet.</p>
        )}
        {lessons.map((lesson, index) => (
          <section key={lesson.id} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">
              {index + 1}. {lesson.title}
            </h2>
            {lesson.videoUrl && <LessonVideo url={lesson.videoUrl} />}
            {lesson.content && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lesson.content}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
