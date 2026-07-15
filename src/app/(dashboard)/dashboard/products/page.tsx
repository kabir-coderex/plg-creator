import { Package } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function ProductsPage() {
  return (
    <PagePlaceholder
      title="Products"
      description="Manage courses, memberships, coaching, and downloadables."
      icon={Package}
    />
  )
}
