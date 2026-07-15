import { KeyRound } from "lucide-react"

import { getApiKeys, getUserMemberships } from "@/lib/dal"
import { ApiKeysManager } from "@/components/admin/api-keys-manager"

export default async function ApiKeysPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const keys = await getApiKeys(org.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <KeyRound className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Generate a key for {org.name} so an AI client (Claude Desktop,
            Cursor, Codex, CLI) can act on this org through MCP.
          </p>
        </div>
      </div>
      <ApiKeysManager orgId={org.id} orgRole={org.role} keys={keys} />
    </div>
  )
}
