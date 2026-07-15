import "server-only"

import { createAnonClient } from "@/lib/supabase/anon"

export type McpAutomation = {
  id: string
  org_id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  action_type: string
  action_config: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
}

export type McpContact = {
  id: string
  org_id: string
  email: string
  name: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

function raise(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

export async function mcpCreateAutomation(
  keyHash: string,
  input: {
    name: string
    triggerType: string
    actionType: string
    triggerConfig?: Record<string, unknown>
    actionConfig?: Record<string, unknown>
    status?: string
  }
): Promise<McpAutomation> {
  const { data, error } = await createAnonClient().rpc("mcp_create_automation", {
    p_key_hash: keyHash,
    p_name: input.name,
    p_trigger_type: input.triggerType,
    p_action_type: input.actionType,
    p_trigger_config: input.triggerConfig ?? {},
    p_action_config: input.actionConfig ?? {},
    p_status: input.status ?? "draft",
  })
  raise(error)
  return data as McpAutomation
}

export async function mcpListAutomations(keyHash: string, status?: string): Promise<McpAutomation[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_automations", {
    p_key_hash: keyHash,
    p_status: status ?? null,
  })
  raise(error)
  return (data ?? []) as McpAutomation[]
}

export async function mcpSetAutomationStatus(
  keyHash: string,
  automationId: string,
  status: "draft" | "active"
): Promise<McpAutomation> {
  const { data, error } = await createAnonClient().rpc("mcp_set_automation_status", {
    p_key_hash: keyHash,
    p_automation_id: automationId,
    p_status: status,
  })
  raise(error)
  return data as McpAutomation
}

export async function mcpDeleteAutomation(keyHash: string, automationId: string): Promise<void> {
  const { error } = await createAnonClient().rpc("mcp_delete_automation", {
    p_key_hash: keyHash,
    p_automation_id: automationId,
  })
  raise(error)
}

export async function mcpListContacts(keyHash: string, tag?: string): Promise<McpContact[]> {
  const { data, error } = await createAnonClient().rpc("mcp_list_contacts", {
    p_key_hash: keyHash,
    p_tag: tag ?? null,
  })
  raise(error)
  return (data ?? []) as McpContact[]
}
