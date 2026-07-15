import { redirect } from "next/navigation"

import { getFunnels, getUserMemberships } from "@/lib/dal"
import { createAutomation } from "@/lib/actions/automations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AutomationForm } from "@/components/automations/automation-form"

export default async function NewAutomationPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  if (org.role !== "owner" && org.role !== "admin" && org.role !== "instructor") {
    redirect("/dashboard/automation")
  }

  const funnels = await getFunnels(org.id)
  const createWithOrg = createAutomation.bind(null, org.id)

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>New automation</CardTitle>
        <CardDescription>
          When a funnel is purchased, tag the buyer as a contact. Leave funnel unset to match any
          funnel in this org.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AutomationForm action={createWithOrg} funnels={funnels} submitLabel="Create automation" />
      </CardContent>
    </Card>
  )
}
