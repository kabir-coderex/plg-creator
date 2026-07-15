import "server-only"

import { createAnonClient } from "@/lib/supabase/anon"

export type McpFunnel = {
  id: string
  org_id: string
  course_id: string
  name: string
  slug: string
  template_key: string
  headline: string
  subheadline: string | null
  description: string | null
  cta_text: string
  price_label: string
  thank_you_message: string
  status: string
  created_at: string
  updated_at: string
}

function raise(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

export async function mcpListFunnels(keyHash: string, status?: string): Promise<McpFunnel[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_funnels", {
    p_key_hash: keyHash,
    p_status: status ?? null,
  })
  raise(error)
  return (data ?? []) as McpFunnel[]
}

export async function mcpCreateFunnel(
  keyHash: string,
  input: {
    courseId: string
    name: string
    slug: string
    headline?: string
    subheadline?: string
    description?: string
    ctaText?: string
    priceLabel?: string
    thankYouMessage?: string
    status?: string
  }
): Promise<McpFunnel> {
  const { data, error } = await createAnonClient().rpc("mcp_create_funnel", {
    p_key_hash: keyHash,
    p_course_id: input.courseId,
    p_name: input.name,
    p_slug: input.slug,
    p_headline: input.headline ?? null,
    p_subheadline: input.subheadline ?? null,
    p_description: input.description ?? null,
    p_cta_text: input.ctaText ?? null,
    p_price_label: input.priceLabel ?? null,
    p_thank_you_message: input.thankYouMessage ?? null,
    p_status: input.status ?? "draft",
  })
  raise(error)
  return data as McpFunnel
}

export async function mcpSetFunnelStatus(
  keyHash: string,
  funnelId: string,
  status: "draft" | "published"
): Promise<McpFunnel> {
  const { data, error } = await createAnonClient().rpc("mcp_set_funnel_status", {
    p_key_hash: keyHash,
    p_funnel_id: funnelId,
    p_status: status,
  })
  raise(error)
  return data as McpFunnel
}

export async function mcpDeleteFunnel(keyHash: string, funnelId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_funnel", {
    p_key_hash: keyHash,
    p_funnel_id: funnelId,
  })
  raise(error)
}
