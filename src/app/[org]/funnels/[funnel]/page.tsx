import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublicFunnel } from "@/lib/public-funnels"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function FunnelLandingPage({
  params,
}: {
  params: Promise<{ org: string; funnel: string }>
}) {
  const { org, funnel: funnelSlug } = await params
  const data = await getPublicFunnel(org, funnelSlug)

  if (!data) {
    notFound()
  }

  const { organization, funnel } = data

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">{organization.name}</p>
      {funnel.courseTitle && <Badge variant="secondary">{funnel.courseTitle}</Badge>}
      <h1 className="text-4xl font-bold tracking-tight">{funnel.headline}</h1>
      {funnel.subheadline && (
        <p className="text-lg text-muted-foreground">{funnel.subheadline}</p>
      )}
      {funnel.description && (
        <p className="whitespace-pre-wrap text-muted-foreground">{funnel.description}</p>
      )}
      <p className="text-3xl font-semibold">{funnel.priceLabel}</p>
      <Button size="lg" render={<Link href={`/${organization.slug}/funnels/${funnel.slug}/checkout`} />}>
        {funnel.ctaText}
      </Button>
    </div>
  )
}
