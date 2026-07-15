import "server-only"
import { randomBytes, createHash } from "node:crypto"

const KEY_PREFIX = "skillguy_live_"
const PREFIX_VISIBLE_CHARS = 6

export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url")
  const plaintext = `${KEY_PREFIX}${secret}`

  return {
    plaintext,
    prefix: plaintext.slice(0, KEY_PREFIX.length + PREFIX_VISIBLE_CHARS),
    hash: hashApiKey(plaintext),
  }
}

export function hashApiKey(plaintext: string) {
  return createHash("sha256").update(plaintext).digest("hex")
}
