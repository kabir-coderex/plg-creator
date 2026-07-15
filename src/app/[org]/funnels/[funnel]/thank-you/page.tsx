import { notFound } from "next/navigation"

import { getPublicFunnel } from "@/lib/public-funnels"

export default async function FunnelThankYouPage({
  params,
}: {
  params: Promise<{ org: string; funnel: string }>
}) {
  const { org, funnel: funnelSlug } = await params
  const data = await getPublicFunnel(org, funnelSlug)

  if (!data) {
    notFound()
  }

  const { funnel } = data

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">You&apos;re in!</h1>
      <p className="whitespace-pre-wrap text-muted-foreground">{funnel.thankYouMessage}</p>
    </div>
  )
}
