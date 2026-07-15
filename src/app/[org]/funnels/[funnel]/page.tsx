import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2, PlayCircle, ShieldCheck } from "lucide-react"

import { getPublicFunnel } from "@/lib/public-funnels"
import { getPublicLessons } from "@/lib/public-courses"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

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
  const lessons = funnel.course ? await getPublicLessons(funnel.course.id) : []
  const checkoutHref = `/${organization.slug}/funnels/${funnel.slug}/checkout`

  return (
    <div className="flex flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">{organization.name}</span>
          {funnel.course && <Badge variant="secondary">{funnel.course.title}</Badge>}
        </div>
      </header>

      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{funnel.headline}</h1>
            {funnel.subheadline && (
              <p className="text-lg text-muted-foreground">{funnel.subheadline}</p>
            )}
            <div>
              <Button size="lg" render={<Link href={checkoutHref} />}>
                {funnel.ctaText} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <Card className="lg:sticky lg:top-6">
            {funnel.course?.thumbnailUrl && (
              <Image
                src={funnel.course.thumbnailUrl}
                alt=""
                width={640}
                height={360}
                unoptimized
                className="h-48 w-full rounded-t-xl object-cover"
              />
            )}
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">One-time payment</span>
                <span className="text-3xl font-bold">{funnel.priceLabel}</span>
              </div>
              <Button size="lg" className="w-full" render={<Link href={checkoutHref} />}>
                {funnel.ctaText}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                Secure checkout — instant access after purchase
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {funnel.description && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">What you&apos;ll get</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{funnel.description}</p>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">
              Inside {funnel.course?.title}
            </h2>
            <div className="flex flex-col gap-2">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {index + 1}. {lesson.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-16 text-center">
        <CheckCircle2 className="size-8 text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight">Ready to get started?</h2>
        <Button size="lg" render={<Link href={checkoutHref} />}>
          {funnel.ctaText} <ArrowRight className="size-4" />
        </Button>
      </section>
    </div>
  )
}
