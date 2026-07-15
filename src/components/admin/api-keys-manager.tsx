"use client"

import { useActionState, useState } from "react"
import { Copy, Check, KeyRound } from "lucide-react"

import { createApiKey, revokeApiKey, type CreateApiKeyState } from "@/lib/actions/api-keys"
import type { ApiKey } from "@/lib/dal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ApiKeysManager({
  orgId,
  orgRole,
  keys,
}: {
  orgId: string
  orgRole: string
  keys: ApiKey[]
}) {
  const canManage = orgRole === "owner" || orgRole === "admin"
  const createWithOrg = createApiKey.bind(null, orgId)
  const [state, action, pending] = useActionState<CreateApiKeyState, FormData>(
    createWithOrg,
    undefined
  )
  const [copied, setCopied] = useState(false)
  // Dismissing the dialog can't just be `!state.createdKey` (that's fixed once the action
  // has run) — track the last key we've shown, and reset dismissal whenever a new one arrives.
  const [lastSeenKey, setLastSeenKey] = useState(state?.createdKey)
  const [dismissed, setDismissed] = useState(false)
  if (state?.createdKey !== lastSeenKey) {
    setLastSeenKey(state?.createdKey)
    setDismissed(false)
  }
  const revealedKey =
    state?.createdKey && !dismissed
      ? { name: state.createdKeyName ?? "Key", key: state.createdKey }
      : null

  async function copyKey() {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate a new key</CardTitle>
            <CardDescription>
              Name it after the client that will use it, e.g. &quot;Claude
              Desktop&quot;.
            </CardDescription>
          </CardHeader>
          <form action={action}>
            <CardContent className="flex gap-2">
              <Input name="name" placeholder="Claude Desktop" required />
              <Button type="submit" disabled={pending}>
                {pending ? "Generating..." : "Generate key"}
              </Button>
            </CardContent>
            {state?.error && (
              <CardContent className="pt-0">
                <p className="text-sm text-destructive">{state.error}</p>
              </CardContent>
            )}
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active keys</CardTitle>
          <CardDescription>
            Only the key prefix is stored in plaintext — the full key is
            shown once, at creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {keys.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No API keys yet.
            </p>
          )}
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {key.keyPrefix}…
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {key.revokedAt ? (
                  <Badge variant="outline">Revoked</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
                {canManage && !key.revokedAt && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`Revoke "${key.name}"? This cannot be undone.`)) return
                      try {
                        await revokeApiKey(key.id)
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed to revoke key.")
                      }
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(revealedKey)}
        onOpenChange={(open) => {
          if (!open) setDismissed(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{revealedKey?.name} created</DialogTitle>
            <DialogDescription>
              Copy this key now — it won&apos;t be shown again. Paste it into
              your AI client&apos;s MCP config as the bearer token.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
            <code className="flex-1 overflow-x-auto font-mono text-xs">
              {revealedKey?.key}
            </code>
            <Button size="icon-sm" variant="outline" onClick={copyKey}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}
