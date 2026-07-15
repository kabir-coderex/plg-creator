import "server-only"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import type { McpAuthContext } from "@/lib/mcp/auth"
import { signupCreator } from "@/lib/mcp/signup"
import { signinCreator } from "@/lib/mcp/signin"
import { MCP_SERVER_NAME } from "@/lib/mcp/constants"

const organizationShape = {
  id: z.string().describe("Organization UUID"),
  name: z.string().describe("Organization display name"),
  slug: z.string().describe("Organization URL slug"),
}

type ToolExtra = { authInfo?: { extra?: Record<string, unknown> } }

// `extra.authInfo.extra` always carries `mcpUrl` (even anonymously); org fields
// (orgId/orgName/...) are only present once a valid API key was presented.
function getMcpUrl(extra: ToolExtra): string {
  return (extra.authInfo?.extra?.mcpUrl as string | undefined) ?? "http://localhost:3000/api/mcp"
}

function requireAuth(extra: ToolExtra): McpAuthContext {
  const ctx = extra.authInfo?.extra as (McpAuthContext & { mcpUrl?: string }) | undefined
  if (!ctx?.orgId) {
    throw new Error("Missing org context — this tool must be called with a valid API key.")
  }
  return ctx
}

function reconnectCommand(mcpUrl: string, apiKey: string): string {
  return (
    `claude mcp remove ${MCP_SERVER_NAME} 2>/dev/null; ` +
    `claude mcp add --transport http ${MCP_SERVER_NAME} --scope user ${mcpUrl} ` +
    `--header "Authorization: Bearer ${apiKey}"`
  )
}

// Shared by `signup` and `signin` — both end with "here's a fresh key, please reconnect."
function reconnectBlock(mcpUrl: string, apiKey: string) {
  const command = reconnectCommand(mcpUrl, apiKey)
  const instructions =
    `If you have shell access, run this now to finish connecting (don't just print the key to the user):\n${command}\n\n` +
    "Then reconnect to this MCP server and call `whoami` to confirm before doing anything else. " +
    `If you have no shell access, tell the user their apiKey is: ${apiKey}`
  return { command, instructions }
}

export function createMcpServer() {
  const server = new McpServer({ name: "plg3-creator", version: "0.1.0" })

  // Permission: NONE — this is the one tool callable with no API key at all (that's the
  // point: it creates the very first org + key for a brand new creator). Prototype-only
  // shortcut: if email/password are omitted, both are generated and returned in the response
  // rather than requiring the human to provide real credentials up front.
  // Example prompt: "Sign me up, my business is called Acme Co."
  // Example response: { organization, credentials: { email, password, ... }, apiKey }
  server.registerTool(
    "signup",
    {
      title: "Sign up",
      description:
        "Create a brand new creator account, organization, and API key in one call. " +
        "Email/password are optional — omit either to have one generated and returned. " +
        "The returned apiKey must be used as the Bearer token for every other tool call.",
      inputSchema: {
        organization_name: z.string().min(2).describe("Name of the business/organization to create"),
        email: z
          .email()
          .optional()
          .describe(
            "Email for the new account. Omit to auto-generate a placeholder (prototype only — not a real inbox)."
          ),
        password: z
          .string()
          .min(8)
          .optional()
          .describe("Password for the new account. Omit to auto-generate a strong one."),
      },
      outputSchema: {
        organization: z.object(organizationShape),
        credentials: z.object({
          email: z.string(),
          password: z.string(),
          emailWasGenerated: z.boolean(),
          passwordWasGenerated: z.boolean(),
        }),
        apiKey: z
          .string()
          .describe("Bearer token for all other tools on this org. Shown only this once."),
        reconnect: z.object({
          command: z
            .string()
            .describe(
              "Shell command that re-registers this MCP connection with the new API key. " +
                "If you (the calling agent) have shell access, run this now instead of showing " +
                "the raw apiKey to the user, then reconnect to this MCP server and call `whoami` " +
                "to confirm before continuing."
            ),
        }),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ organization_name, email, password }, extra) => {
      const result = await signupCreator({ organizationName: organization_name, email, password })
      const { command, instructions } = reconnectBlock(getMcpUrl(extra), result.apiKey)

      return {
        content: [
          {
            type: "text",
            text:
              `Created organization "${result.organization.name}". ` +
              `Email: ${result.credentials.email}${result.credentials.emailWasGenerated ? " (auto-generated)" : ""}, ` +
              `password: ${result.credentials.password}${result.credentials.passwordWasGenerated ? " (auto-generated)" : ""}.\n\n` +
              instructions,
          },
        ],
        structuredContent: { ...result, reconnect: { command } },
      }
    }
  )

  // Permission: NONE — for a creator who already has an account (via web signup or a
  // previous `signup` call) but needs a fresh API key, e.g. a new device or a lost key.
  // Always issues a brand new key rather than returning an existing one (keys are
  // write-once/shown-once by design — there's nothing to "look up" and show again).
  // Example prompt: "Sign me in, my email is jane@acme.com."
  // Example response: { organization, apiKey, reconnect: { command } }
  server.registerTool(
    "signin",
    {
      title: "Sign in",
      description:
        "Sign in to an existing account and issue a fresh API key for MCP access. Use this " +
        "instead of `signup` when the account already exists (created via the web dashboard " +
        "or a previous `signup` call) — e.g. reconnecting from a new device or a lost key.",
      inputSchema: {
        email: z.email().describe("Email of the existing account"),
        password: z.string().min(1).describe("Password of the existing account"),
      },
      outputSchema: {
        organization: z.object(organizationShape),
        apiKey: z
          .string()
          .describe("Newly issued bearer token for all other tools on this org. Shown only this once."),
        reconnect: z.object({
          command: z
            .string()
            .describe(
              "Shell command that re-registers this MCP connection with the new API key. " +
                "If you (the calling agent) have shell access, run this now instead of showing " +
                "the raw apiKey to the user, then reconnect to this MCP server and call `whoami` " +
                "to confirm before continuing."
            ),
        }),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ email, password }, extra) => {
      const result = await signinCreator({ email, password })
      const { command, instructions } = reconnectBlock(getMcpUrl(extra), result.apiKey)

      return {
        content: [
          {
            type: "text",
            text: `Signed in to organization "${result.organization.name}".\n\n${instructions}`,
          },
        ],
        structuredContent: { ...result, reconnect: { command } },
      }
    }
  )

  // Permission: any valid, non-revoked API key. Scoped to the calling key's own org only.
  // Example prompt: "Who am I connected as?"
  // Example response: { organization: { id, name, slug }, key: { id, name } }
  server.registerTool(
    "whoami",
    {
      title: "Who am I",
      description:
        "Identify the organization and API key this request is authenticated as.",
      outputSchema: {
        organization: z.object(organizationShape),
        key: z.object({
          id: z.string().describe("API key UUID"),
          name: z.string().describe("API key label set by the creator"),
        }),
      },
    },
    async (extra) => {
      const ctx = requireAuth(extra)
      const structuredContent = {
        organization: { id: ctx.orgId, name: ctx.orgName, slug: ctx.orgSlug },
        key: { id: ctx.keyId, name: ctx.keyName },
      }
      return {
        content: [
          {
            type: "text",
            text: `Authenticated as "${ctx.keyName}" for organization "${ctx.orgName}".`,
          },
        ],
        structuredContent,
      }
    }
  )

  // Permission: any valid, non-revoked API key. Each key belongs to exactly one org, so this
  // always returns a single-element list — the shape is forward-compatible with any future
  // multi-org-per-key support.
  // Example prompt: "List my organizations."
  // Example response: { organizations: [{ id, name, slug }] }
  server.registerTool(
    "list_organizations",
    {
      title: "List organizations",
      description: "List the organization(s) accessible with this API key.",
      outputSchema: {
        organizations: z.array(z.object(organizationShape)),
      },
    },
    async (extra) => {
      const ctx = requireAuth(extra)
      const structuredContent = {
        organizations: [{ id: ctx.orgId, name: ctx.orgName, slug: ctx.orgSlug }],
      }
      return {
        content: [{ type: "text", text: `Organization: ${ctx.orgName} (${ctx.orgSlug})` }],
        structuredContent,
      }
    }
  )

  return server
}
