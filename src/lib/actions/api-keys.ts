"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { generateApiKey } from "@/lib/api-keys"

export type CreateApiKeyState =
  | { error?: string; createdKey?: string; createdKeyName?: string }
  | undefined

export async function createApiKey(
  orgId: string,
  _prevState: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  const name = (formData.get("name") as string)?.trim()

  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { plaintext, prefix, hash } = generateApiKey()

  const { error } = await supabase.from("api_keys").insert({
    org_id: orgId,
    name,
    key_prefix: prefix,
    key_hash: hash,
    created_by: user?.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/admin/api-keys")
  return { createdKey: plaintext, createdKeyName: name }
}

export async function revokeApiKey(keyId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)

  if (error) {
    throw error
  }

  revalidatePath("/dashboard/admin/api-keys")
}
