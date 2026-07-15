import "server-only"

import { hashApiKey } from "@/lib/api-keys"
import { createAnonClient } from "@/lib/supabase/anon"

export type McpAuthContext = {
  orgId: string
  orgName: string
  orgSlug: string
  keyId: string
  keyName: string
}

export async function authenticateApiKey(rawKey: string): Promise<McpAuthContext | null> {
  const supabase = createAnonClient()

  const { data, error } = await supabase
    .rpc("authenticate_api_key", { p_key_hash: hashApiKey(rawKey) })
    .single<{
      org_id: string
      org_name: string
      org_slug: string
      key_id: string
      key_name: string
    }>()

  if (error || !data) {
    return null
  }

  return {
    orgId: data.org_id,
    orgName: data.org_name,
    orgSlug: data.org_slug,
    keyId: data.key_id,
    keyName: data.key_name,
  }
}
