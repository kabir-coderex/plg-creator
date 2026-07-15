import { notFound } from "next/navigation"

import { getAutomation, getAutomationRuns, getFunnels, getUserMemberships } from "@/lib/dal"
import { updateAutomation } from "@/lib/actions/automations"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AutomationForm } from "@/components/automations/automation-form"
import { AutomationActions } from "@/components/automations/automation-actions"

export default async function AutomationDetailPage({
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

  const automation = await getAutomation(org.id, id)
  if (!automation) {
    notFound()
  }

  const [funnels, runs] = await Promise.all([
    getFunnels(org.id),
    getAutomationRuns(org.id, automation.id),
  ])
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"
  const updateWithId = updateAutomation.bind(null, automation.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{automation.name}</h1>
          <Badge variant={automation.status === "active" ? "default" : "outline"}>
            {automation.status}
          </Badge>
        </div>
        {canManage && <AutomationActions automation={automation} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <AutomationForm
                action={updateWithId}
                funnels={funnels}
                automation={automation}
                submitLabel="Save changes"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                When a funnel is purchased, tag contact{" "}
                <Badge variant="secondary">{automation.actionConfig.tag}</Badge>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hasn&apos;t fired yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
                  >
                    <span className="font-medium">{run.contactEmail}</span>
                    <span className="text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
