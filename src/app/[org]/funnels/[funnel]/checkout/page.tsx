import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import { getPublicFunnel } from "@/lib/public-funnels"
import { submitDemoCheckout } from "@/lib/actions/funnels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const { organization, funnel } = data
  const checkoutAction = submitDemoCheckout.bind(null, org, funnelSlug)

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href={`/${organization.slug}/funnels/${funnel.slug}`}
            className="text-sm font-semibold tracking-tight hover:underline"
          >
            {organization.name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            Secure checkout
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-16 md:grid-cols-[1fr_1.1fr]">
        <Card className="h-fit">
          {funnel.course?.thumbnailUrl && (
            <Image
              src={funnel.course.thumbnailUrl}
              alt=""
              width={480}
              height={270}
              unoptimized
              className="h-44 w-full rounded-t-xl object-cover"
            />
          )}
          <CardHeader>
            <CardTitle className="text-base">{funnel.name}</CardTitle>
            {funnel.course && (
              <p className="text-sm text-muted-foreground">{funnel.course.title}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {funnel.description && (
              <p className="text-sm text-muted-foreground">{funnel.description}</p>
            )}
            <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{funnel.priceLabel}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm action={checkoutAction} ctaText={funnel.ctaText} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
