"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { uniqueSlug } from "@/lib/slug"

export type OnboardState = { error?: string } | undefined

export async function createOrganization(
  _prevState: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const name = (formData.get("name") as string)?.trim()

  if (!name || name.length < 2) {
    return { error: "Business name must be at least 2 characters." }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc("create_organization_with_owner", {
    org_name: name,
    org_slug: uniqueSlug(name),
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}
