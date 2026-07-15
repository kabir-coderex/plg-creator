import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { getPublicFunnel } from "@/lib/public-funnels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

  const { organization, funnel } = data

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-7 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">You&apos;re in!</h1>
      <p className="whitespace-pre-wrap text-muted-foreground">{funnel.thankYouMessage}</p>

      {funnel.course && (
        <Card className="w-full">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div className="text-left">
              <p className="text-sm text-muted-foreground">You now have access to</p>
              <p className="font-semibold">{funnel.course.title}</p>
            </div>
            {funnel.course.isPublished && (
              <Button render={<Link href={`/${organization.slug}/courses/${funnel.course.slug}`} />}>
                Go to course
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
