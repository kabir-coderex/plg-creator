import { Contact } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function CRMPage() {
  return (
    <PagePlaceholder
      title="CRM"
      description="View contacts, tags, and purchase history."
      icon={Contact}
    />
  )
}
