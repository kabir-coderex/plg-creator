import Link from "next/link"
import { Workflow } from "lucide-react"

import { getAutomations, getUserMemberships } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AutomationPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const automations = await getAutomations(org.id)
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automation</h1>
          <p className="text-sm text-muted-foreground">
            Trigger → action rules. Right now: a funnel purchase can tag a contact.
          </p>
        </div>
        {canManage && (
          <Button render={<Link href="/dashboard/automation/new" />}>New automation</Button>
        )}
      </div>

      {automations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Workflow className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No automations yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create one from the dashboard, or just tell your AI: &quot;Tag anyone who buys ___ as
            &apos;buyer&apos;.&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {automations.map((automation) => (
            <Link key={automation.id} href={`/dashboard/automation/${automation.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{automation.name}</CardTitle>
                  <Badge variant={automation.status === "active" ? "default" : "outline"}>
                    {automation.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p>
                    When a funnel is purchased{automation.triggerConfig.funnel_id ? "" : " (any funnel)"}, tag
                    contact <Badge variant="secondary">{automation.actionConfig.tag}</Badge>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
