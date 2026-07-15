import "server-only"
import { createClient } from "@supabase/supabase-js"

import { generateApiKey } from "@/lib/api-keys"

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

export type SigninResult = {
  organization: { id: string; name: string; slug: string }
  apiKey: string
}

export async function signinCreator(input: {
  email: string
  password: string
}): Promise<SigninResult> {
  const anon = createAnonClient()
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword(input)

  if (signInError) {
    throw new Error(`Sign in failed: ${signInError.message}`)
  }

  const accessToken = signInData.session?.access_token
  if (!accessToken) {
    throw new Error("Sign in succeeded but returned no session.")
  }

  // A client carrying the signed-in user's access token — RLS scopes everything below to them.
  const authed = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  // A creator can belong to more than one org, but a single API key is scoped to exactly
  // one — same simplification the dashboard makes today (see `getUserMemberships()`
  // callers). Picks the first membership; there's no org-selection story yet.
  const { data: memberships, error: membershipError } = await authed
    .from("memberships")
    .select("org_id, organizations (id, name, slug)")
    .limit(1)

  if (membershipError) {
    throw new Error(`Could not load organization: ${membershipError.message}`)
  }

  const row = memberships?.[0]
  const org = Array.isArray(row?.organizations) ? row.organizations[0] : row?.organizations

  if (!org) {
    throw new Error("This account has no organization yet — use the `signup` tool instead.")
  }

  const { plaintext, prefix, hash } = generateApiKey()
  const {
    data: { user },
  } = await authed.auth.getUser()

  const { error: keyError } = await authed.from("api_keys").insert({
    org_id: org.id,
    name: "sign-in (auto-generated)",
    key_prefix: prefix,
    key_hash: hash,
    created_by: user?.id,
  })

  if (keyError) {
    throw new Error(
      `Could not create an API key (${keyError.message}). Only org owners/admins can generate ` +
        "API keys — ask an admin to generate one for you in the dashboard instead."
    )
  }

  return {
    organization: { id: org.id, name: org.name, slug: org.slug },
    apiKey: plaintext,
  }
}
