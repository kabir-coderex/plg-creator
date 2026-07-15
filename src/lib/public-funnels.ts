import "server-only"

import { createClient } from "@/lib/supabase/server"

export type PublicFunnel = {
  id: string
  name: string
  slug: string
  headline: string
  subheadline: string | null
  description: string | null
  ctaText: string
  priceLabel: string
  thankYouMessage: string
  courseTitle: string | null
}

export async function getPublicFunnel(
  orgSlug: string,
  funnelSlug: string
): Promise<{ organization: { name: string; slug: string }; funnel: PublicFunnel } | null> {
  const supabase = await createClient()

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle()

  if (orgError) {
    throw orgError
  }
  if (!org) {
    return null
  }

  const { data: funnel, error: funnelError } = await supabase
    .from("funnels")
    .select(
      "id, name, slug, headline, subheadline, description, cta_text, price_label, thank_you_message, courses (title)"
    )
    .eq("org_id", org.id)
    .eq("slug", funnelSlug)
    .eq("status", "published")
    .maybeSingle()

  if (funnelError) {
    throw funnelError
  }
  if (!funnel) {
    return null
  }

  const course = Array.isArray(funnel.courses) ? funnel.courses[0] : funnel.courses

  return {
    organization: { name: org.name, slug: org.slug },
    funnel: {
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      headline: funnel.headline,
      subheadline: funnel.subheadline,
      description: funnel.description,
      ctaText: funnel.cta_text,
      priceLabel: funnel.price_label,
      thankYouMessage: funnel.thank_you_message,
      courseTitle: course?.title ?? null,
    },
  }
}
