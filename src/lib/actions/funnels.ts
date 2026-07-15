"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { createAnonClient } from "@/lib/supabase/anon"
import { uniqueSlug } from "@/lib/slug"

export type FunnelFormState = { error?: string } | undefined

function readFunnelFields(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const courseId = (formData.get("course_id") as string) || null
  const headline = (formData.get("headline") as string)?.trim() || ""
  const subheadline = (formData.get("subheadline") as string)?.trim() || null
  const description = (formData.get("description") as string)?.trim() || null
  const ctaText = (formData.get("cta_text") as string)?.trim() || "Get instant access"
  const priceLabel = (formData.get("price_label") as string)?.trim() || "$0"
  const thankYouMessage =
    (formData.get("thank_you_message") as string)?.trim() ||
    "Thanks for your order! Check your email for access details."

  return { name, courseId, headline, subheadline, description, ctaText, priceLabel, thankYouMessage }
}

export async function createFunnel(
  orgId: string,
  _prevState: FunnelFormState,
  formData: FormData
): Promise<FunnelFormState> {
  const fields = readFunnelFields(formData)

  if (!fields.name || fields.name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }
  if (!fields.courseId) {
    return { error: "Choose a course for this funnel." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("funnels")
    .insert({
      org_id: orgId,
      course_id: fields.courseId,
      name: fields.name,
      slug: uniqueSlug(fields.name),
      headline: fields.headline,
      subheadline: fields.subheadline,
      description: fields.description,
      cta_text: fields.ctaText,
      price_label: fields.priceLabel,
      thank_you_message: fields.thankYouMessage,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/funnels")
  redirect(`/dashboard/funnels/${data.id}`)
}

export async function updateFunnel(
  funnelId: string,
  _prevState: FunnelFormState,
  formData: FormData
): Promise<FunnelFormState> {
  const fields = readFunnelFields(formData)

  if (!fields.name || fields.name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }
  if (!fields.courseId) {
    return { error: "Choose a course for this funnel." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("funnels")
    .update({
      course_id: fields.courseId,
      name: fields.name,
      headline: fields.headline,
      subheadline: fields.subheadline,
      description: fields.description,
      cta_text: fields.ctaText,
      price_label: fields.priceLabel,
      thank_you_message: fields.thankYouMessage,
    })
    .eq("id", funnelId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/funnels/${funnelId}`)
  revalidatePath("/dashboard/funnels")
  return undefined
}

export async function setFunnelStatus(funnelId: string, status: "draft" | "published") {
  const supabase = await createClient()
  const { error } = await supabase.from("funnels").update({ status }).eq("id", funnelId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/funnels/${funnelId}`)
  revalidatePath("/dashboard/funnels")
}

export async function deleteFunnel(funnelId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("funnels").delete().eq("id", funnelId)

  if (error) {
    throw error
  }

  revalidatePath("/dashboard/funnels")
  redirect("/dashboard/funnels")
}

export type CheckoutFormState = { error?: string } | undefined

// Public, unauthenticated action — runs the demo checkout via the anon-callable
// create_demo_order RPC (see docs/Milestone.md M4). No Stripe, no real charge.
export async function submitDemoCheckout(
  orgSlug: string,
  funnelSlug: string,
  _prevState: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const customerName = (formData.get("customer_name") as string)?.trim()
  const customerEmail = (formData.get("customer_email") as string)?.trim()

  if (!customerName) {
    return { error: "Name is required." }
  }
  if (!customerEmail) {
    return { error: "Email is required." }
  }

  const { error } = await createAnonClient().rpc("create_demo_order", {
    p_org_slug: orgSlug,
    p_funnel_slug: funnelSlug,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/${orgSlug}/funnels/${funnelSlug}/thank-you`)
}
