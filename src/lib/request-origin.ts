import "server-only"

// Shared by the landing page's connect instructions and the MCP route handler, so both
// derive the deployed origin the same way instead of drifting.
export function resolvePublicOrigin(host: string, forwardedProto: string | null) {
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1")
  const proto = forwardedProto ?? (isLocal ? "http" : "https")
  return `${proto}://${host}`
}
