import { Megaphone } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function MarketingPage() {
  return (
    <PagePlaceholder
      title="Marketing"
      description="Manage broadcasts, sequences, and segments."
      icon={Megaphone}
    />
  )
}
