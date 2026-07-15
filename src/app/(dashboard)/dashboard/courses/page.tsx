import Link from "next/link"
import Image from "next/image"
import { GraduationCap } from "lucide-react"

import { getCategories, getCourses, getUserMemberships } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryQuickAdd } from "@/components/courses/category-quick-add"

export default async function CoursesPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const [courses, categories] = await Promise.all([getCourses(org.id), getCategories(org.id)])
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Build lessons, quizzes, and drip schedules.
          </p>
        </div>
        {canManage && (
          <Button render={<Link href="/dashboard/courses/new" />}>New course</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <CategoryQuickAdd orgId={org.id} categories={categories} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {courses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No courses yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create one from the dashboard, or just tell your AI: &quot;Create a course called
            ___.&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                {course.thumbnailUrl && (
                  <Image
                    src={course.thumbnailUrl}
                    alt=""
                    width={320}
                    height={180}
                    unoptimized
                    className="h-40 w-full object-cover"
                  />
                )}
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <Badge variant={course.status === "published" ? "default" : "outline"}>
                    {course.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {course.categoryName && <Badge variant="secondary">{course.categoryName}</Badge>}
                  {course.description && <p className="line-clamp-2">{course.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
