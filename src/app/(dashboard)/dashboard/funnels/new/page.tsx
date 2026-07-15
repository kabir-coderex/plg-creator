import { redirect } from "next/navigation"

import { getCourses, getUserMemberships } from "@/lib/dal"
import { createFunnel } from "@/lib/actions/funnels"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FunnelForm } from "@/components/funnels/funnel-form"

export default async function NewFunnelPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  if (org.role !== "owner" && org.role !== "admin" && org.role !== "instructor") {
    redirect("/dashboard/funnels")
  }

  const courses = await getCourses(org.id)
  const createWithOrg = createFunnel.bind(null, org.id)

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>New funnel</CardTitle>
        <CardDescription>
          One built-in template covers the landing, checkout, and thank-you pages — just fill in the copy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FunnelForm action={createWithOrg} courses={courses} submitLabel="Create funnel" />
      </CardContent>
    </Card>
  )
}
