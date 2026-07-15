import Link from "next/link"
import { notFound } from "next/navigation"

import { getCourses, getFunnel, getOrders, getUserMemberships } from "@/lib/dal"
import { updateFunnel } from "@/lib/actions/funnels"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FunnelForm } from "@/components/funnels/funnel-form"
import { FunnelActions } from "@/components/funnels/funnel-actions"

export default async function FunnelDetailPage({
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

  const funnel = await getFunnel(org.id, id)
  if (!funnel) {
    notFound()
  }

  const [courses, orders] = await Promise.all([
    getCourses(org.id),
    getOrders(org.id, funnel.id),
  ])
  const canManage = org.role === "owner" || org.role === "admin" || org.role === "instructor"
  const updateWithId = updateFunnel.bind(null, funnel.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{funnel.name}</h1>
          <Badge variant={funnel.status === "published" ? "default" : "outline"}>
            {funnel.status}
          </Badge>
          <Link
            href={`/${org.slug}/funnels/${funnel.slug}`}
            target="_blank"
            className="text-sm text-primary underline underline-offset-4"
          >
            {funnel.status === "published" ? "View funnel ↗" : "Preview funnel ↗"}
          </Link>
        </div>
        {canManage && <FunnelActions funnel={funnel} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <FunnelForm
                action={updateWithId}
                courses={courses}
                funnel={funnel}
                submitLabel="Save changes"
              />
            ) : (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {funnel.courseTitle && <Badge variant="secondary">{funnel.courseTitle}</Badge>}
                <p>{funnel.headline}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customerName}</span>
                      <span className="text-muted-foreground">{order.customerEmail}</span>
                    </div>
                    <Badge variant="secondary">{order.status}</Badge>
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
