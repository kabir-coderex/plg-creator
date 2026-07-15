import { notFound } from "next/navigation"

import { getPublicFunnel } from "@/lib/public-funnels"
import { submitDemoCheckout } from "@/lib/actions/funnels"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckoutForm } from "@/components/funnels/checkout-form"

export default async function FunnelCheckoutPage({
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
  const checkoutAction = submitDemoCheckout.bind(null, org, funnelSlug)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{funnel.name}</CardTitle>
          <CardDescription>{funnel.priceLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm action={checkoutAction} ctaText={funnel.ctaText} />
        </CardContent>
      </Card>
    </div>
  )
}
