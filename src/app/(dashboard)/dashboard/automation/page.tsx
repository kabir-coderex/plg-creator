import { Workflow } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function AutomationPage() {
  return (
    <PagePlaceholder
      title="Automation"
      description="Build trigger-based workflows."
      icon={Workflow}
    />
  )
}
