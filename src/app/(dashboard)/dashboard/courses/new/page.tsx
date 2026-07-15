import { redirect } from "next/navigation"

import { getCategories, getUserMemberships } from "@/lib/dal"
import { createCourse } from "@/lib/actions/courses"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseForm } from "@/components/courses/course-form"

export default async function NewCoursePage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  if (org.role !== "owner" && org.role !== "admin" && org.role !== "instructor") {
    redirect("/dashboard/courses")
  }

  const categories = await getCategories(org.id)
  const createWithOrg = createCourse.bind(null, org.id)

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>New course</CardTitle>
        <CardDescription>Give it a title — you can add lessons after creating it.</CardDescription>
      </CardHeader>
      <CardContent>
        <CourseForm action={createWithOrg} categories={categories} submitLabel="Create course" />
      </CardContent>
    </Card>
  )
}
