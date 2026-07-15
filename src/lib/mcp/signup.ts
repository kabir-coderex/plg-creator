import "server-only"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"

import { generateApiKey } from "@/lib/api-keys"
import { slugify, uniqueSlug } from "@/lib/slug"
import { createAnonClient } from "@/lib/supabase/anon"

// Prototype-only: no real inbox exists at this domain. There is no confirmation email to
// receive and no way to recover the account through it — it's a placeholder, not a mailbox.
const PLACEHOLDER_EMAIL_DOMAIN = "creators.plg3.invalid"

function generatePlaceholderEmail(organizationName: string) {
  const local = slugify(organizationName).slice(0, 20) || "creator"
  return `${local}-${randomBytes(4).toString("hex")}@${PLACEHOLDER_EMAIL_DOMAIN}`
}

function generateStrongPassword() {
  return randomBytes(18).toString("base64url")
}

export type SignupResult = {
  organization: { id: string; name: string; slug: string }
  credentials: {
    email: string
    password: string
    emailWasGenerated: boolean
    passwordWasGenerated: boolean
  }
  apiKey: string
}

export async function signupCreator(input: {
  organizationName: string
  email?: string
  password?: string
}): Promise<SignupResult> {
  const emailWasGenerated = !input.email
  const passwordWasGenerated = !input.password
  const email = input.email ?? generatePlaceholderEmail(input.organizationName)
  const password = input.password ?? generateStrongPassword()

  const anon = createAnonClient()
  const { data: signUpData, error: signUpError } = await anon.auth.signUp({ email, password })

  if (signUpError) {
    throw new Error(`Signup failed: ${signUpError.message}`)
  }

  const accessToken = signUpData.session?.access_token
  if (!accessToken) {
    throw new Error(
      "Signup succeeded but the account has no active session — email confirmation is required on this project, so it can't be completed over MCP."
    )
  }

  // A client carrying the fresh user's access token — RLS/RPC checks run as that user,
  // same as the web onboarding flow, just without cookies.
  const authed = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  const slug = uniqueSlug(input.organizationName)
  const { data: orgId, error: orgError } = await authed.rpc("create_organization_with_owner", {
    org_name: input.organizationName,
    org_slug: slug,
  })

  if (orgError) {
    throw new Error(`Organization creation failed: ${orgError.message}`)
  }

  const { plaintext, prefix, hash } = generateApiKey()
  const {
    data: { user },
  } = await authed.auth.getUser()

  const { error: keyError } = await authed.from("api_keys").insert({
    org_id: orgId,
    name: "signup (auto-generated)",
    key_prefix: prefix,
    key_hash: hash,
    created_by: user?.id,
  })

  if (keyError) {
    throw new Error(`API key creation failed: ${keyError.message}`)
  }

  return {
    organization: { id: orgId as string, name: input.organizationName, slug },
    credentials: { email, password, emailWasGenerated, passwordWasGenerated },
    apiKey: plaintext,
  }
}
