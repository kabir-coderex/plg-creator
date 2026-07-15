import { ShieldCheck } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function AdminPage() {
  return (
    <PagePlaceholder
      title="Admin"
      description="Manage users, roles, and permissions."
      icon={ShieldCheck}
    />
  )
}
