import { notFound } from "next/navigation"

import { getCategories, getCourse, getLessons, getUserMemberships } from "@/lib/dal"
import { updateCourse } from "@/lib/actions/courses"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseForm } from "@/components/courses/course-form"
import { CourseActions } from "@/components/courses/course-actions"
import { LessonsManager } from "@/components/courses/lessons-manager"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const course = await getCourse(org.id, id)
  if (!course) {
    notFound()
  }

  const [categories, lessons] = await Promise.all([
    getCategories(org.id),
    getLessons(org.id, course.id),
  ])
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"
  const updateWithIds = updateCourse.bind(null, course.id, org.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <Badge variant={course.status === "published" ? "default" : "outline"}>
            {course.status}
          </Badge>
        </div>
        {canManage && <CourseActions course={course} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <CourseForm
                action={updateWithIds}
                categories={categories}
                course={course}
                submitLabel="Save changes"
              />
            ) : (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {course.categoryName && <Badge variant="secondary">{course.categoryName}</Badge>}
                <p>{course.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <LessonsManager
              courseId={course.id}
              orgId={org.id}
              lessons={lessons}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
