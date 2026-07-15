import Link from "next/link"
import { Filter } from "lucide-react"

import { getFunnels, getUserMemberships } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function FunnelsPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const funnels = await getFunnels(org.id)
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funnels</h1>
          <p className="text-sm text-muted-foreground">
            Design landing, checkout, and thank-you flows for your courses.
          </p>
        </div>
        {canManage && (
          <Button render={<Link href="/dashboard/funnels/new" />}>New funnel</Button>
        )}
      </div>

      {funnels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Filter className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No funnels yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create one from the dashboard, or just tell your AI: &quot;Create a funnel for
            ___.&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {funnels.map((funnel) => (
            <Link key={funnel.id} href={`/dashboard/funnels/${funnel.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{funnel.name}</CardTitle>
                  <Badge variant={funnel.status === "published" ? "default" : "outline"}>
                    {funnel.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {funnel.courseTitle && <Badge variant="secondary">{funnel.courseTitle}</Badge>}
                  {funnel.headline && <p className="line-clamp-2">{funnel.headline}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
