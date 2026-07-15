import { Radio } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function EventsPage() {
  return (
    <PagePlaceholder
      title="Events"
      description="Run live sessions, webinars, and replays."
      icon={Radio}
    />
  )
}
