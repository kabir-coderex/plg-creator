import { Mic } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function PodcastPage() {
  return (
    <PagePlaceholder
      title="Podcast"
      description="Publish episodes and manage your RSS feed."
      icon={Mic}
    />
  )
}
