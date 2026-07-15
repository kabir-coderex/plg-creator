import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function getAuthedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export type OrgMembership = {
  id: string
  name: string
  slug: string
  role: string
}

export async function getUserMemberships(): Promise<OrgMembership[]> {
  const user = await getAuthedUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations (id, name, slug)")
    .eq("user_id", user.id)

  if (error) {
    throw error
  }

  return (data ?? []).flatMap((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations
    if (!org) return []
    return [{ id: org.id, name: org.name, slug: org.slug, role: row.role }]
  })
}

export type ApiKey = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export async function getApiKeys(orgId: string): Promise<ApiKey[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  }))
}
