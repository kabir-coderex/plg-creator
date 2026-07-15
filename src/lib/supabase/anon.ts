import "server-only"
import { createClient } from "@supabase/supabase-js"

// Unauthenticated (publishable-key) client for MCP request handling — these calls carry no
// Supabase user session; authorization is done inside SECURITY DEFINER RPCs keyed off an
// api_keys hash instead (see authenticate_api_key / mcp_authenticated_org).
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
