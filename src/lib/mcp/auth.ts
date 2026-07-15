import "server-only"
import { createClient } from "@supabase/supabase-js"

import { hashApiKey } from "@/lib/api-keys"

export type McpAuthContext = {
  orgId: string
  orgName: string
  orgSlug: string
  keyId: string
  keyName: string
}

// Unauthenticated (publishable-key) client — API keys are validated via the
// `authenticate_api_key` SECURITY DEFINER RPC, not a Supabase user session.
function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
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
