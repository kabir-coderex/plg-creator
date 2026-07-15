import { Users } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function CommunityPage() {
  return (
    <PagePlaceholder
      title="Community"
      description="Manage spaces, feed, and members."
      icon={Users}
    />
  )
}
