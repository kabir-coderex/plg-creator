import { CreditCard } from "lucide-react"

import { PagePlaceholder } from "@/components/layout/page-placeholder"

export default function CheckoutPage() {
  return (
    <PagePlaceholder
      title="Checkout"
      description="Configure payments, coupons, and order bumps."
      icon={CreditCard}
    />
  )
}
