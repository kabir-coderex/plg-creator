import "server-only"
import { randomBytes } from "node:crypto"

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function uniqueSlug(name: string) {
  return `${slugify(name)}-${randomBytes(2).toString("hex")}`
}
