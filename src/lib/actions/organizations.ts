"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type OnboardState = { error?: string } | undefined

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function createOrganization(
  _prevState: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const name = (formData.get("name") as string)?.trim()

  if (!name || name.length < 2) {
    return { error: "Business name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`

  const { error } = await supabase.rpc("create_organization_with_owner", {
    org_name: name,
    org_slug: slug,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}
