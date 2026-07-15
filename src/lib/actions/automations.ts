"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AutomationFormState = { error?: string } | undefined

function readAutomationFields(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const funnelId = (formData.get("funnel_id") as string) || null
  const tag = (formData.get("tag") as string)?.trim() || "customer"

  return { name, funnelId, tag }
}

export async function createAutomation(
  orgId: string,
  _prevState: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const fields = readAutomationFields(formData)

  if (!fields.name || fields.name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("automations")
    .insert({
      org_id: orgId,
      name: fields.name,
      trigger_type: "funnel_purchased",
      trigger_config: fields.funnelId ? { funnel_id: fields.funnelId } : {},
      action_type: "tag_contact",
      action_config: { tag: fields.tag },
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/automation")
  redirect(`/dashboard/automation/${data.id}`)
}

export async function updateAutomation(
  automationId: string,
  _prevState: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const fields = readAutomationFields(formData)

  if (!fields.name || fields.name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("automations")
    .update({
      name: fields.name,
      trigger_config: fields.funnelId ? { funnel_id: fields.funnelId } : {},
      action_config: { tag: fields.tag },
    })
    .eq("id", automationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/automation/${automationId}`)
  revalidatePath("/dashboard/automation")
  return undefined
}

export async function setAutomationStatus(automationId: string, status: "draft" | "active") {
  const supabase = await createClient()
  const { error } = await supabase.from("automations").update({ status }).eq("id", automationId)

  if (error) {
    throw error
  }

  revalidatePath(`/dashboard/automation/${automationId}`)
  revalidatePath("/dashboard/automation")
}

export async function deleteAutomation(automationId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("automations").delete().eq("id", automationId)

  if (error) {
    throw error
  }

  revalidatePath("/dashboard/automation")
  redirect("/dashboard/automation")
}
