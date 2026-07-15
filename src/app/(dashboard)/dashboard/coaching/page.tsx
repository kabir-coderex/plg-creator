import { CalendarCheck } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function CoachingPage() {
  return (
    <PagePlaceholder
      title="Coaching"
      description="Manage sessions, packages, and availability."
      icon={CalendarCheck}
    />
  )
}
