import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

import { createMcpServer } from "@/lib/mcp/server"
import { authenticateApiKey } from "@/lib/mcp/auth"
import { resolvePublicOrigin } from "@/lib/request-origin"

export const runtime = "nodejs"

function getMcpUrl(request: Request): string {
  const host = request.headers.get("host") ?? new URL(request.url).host
  return `${resolvePublicOrigin(host, request.headers.get("x-forwarded-proto"))}/api/mcp`
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization") ?? ""
  const [scheme, token] = authHeader.split(" ")
  const hasBearer = scheme?.toLowerCase() === "bearer" && Boolean(token)

  // A *present but wrong* key is a hard failure. A *missing* key is allowed through —
  // the only tool reachable without org context is `signup` (every other tool calls
  // `requireAuth()` and rejects itself). This lets an AI client bootstrap a brand new
  // account/org/key before it has anything to authenticate with.
  const org = hasBearer ? await authenticateApiKey(token) : null

  if (hasBearer && !org) {
    return Response.json({ error: "Invalid or revoked API key." }, { status: 401 })
  }

  // Stateless: a fresh server + transport per request. There's no session to
  // reuse across requests in a serverless environment, and every request is
  // independently authenticated by its own bearer token anyway.
  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)

  // `extra` always carries mcpUrl (so `signup` can tell the client where it's connected to,
  // even anonymously) plus the org context once a valid key is presented.
  return transport.handleRequest(request, {
    authInfo: {
      token: token ?? "",
      clientId: org?.keyId ?? "anonymous",
      scopes: [],
      extra: { mcpUrl: getMcpUrl(request), ...org },
    },
  })
}

export { handleMcpRequest as GET, handleMcpRequest as POST, handleMcpRequest as DELETE }
