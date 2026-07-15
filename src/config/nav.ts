import {
  LayoutDashboard,
  Globe,
  Package,
  GraduationCap,
  Filter,
  Users,
  CalendarCheck,
  Radio,
  Mic,
  CreditCard,
  Contact,
  Handshake,
  Megaphone,
  Mail,
  Workflow,
  BarChart3,
  Sparkles,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Build",
    items: [
      { title: "Website", href: "/dashboard/website", icon: Globe },
      { title: "Products", href: "/dashboard/products", icon: Package },
      { title: "Courses", href: "/dashboard/courses", icon: GraduationCap },
      { title: "Funnels", href: "/dashboard/funnels", icon: Filter },
    ],
  },
  {
    title: "Engage",
    items: [
      { title: "Community", href: "/dashboard/community", icon: Users },
      { title: "Coaching", href: "/dashboard/coaching", icon: CalendarCheck },
      { title: "Events", href: "/dashboard/events", icon: Radio },
      { title: "Podcast", href: "/dashboard/podcast", icon: Mic },
    ],
  },
  {
    title: "Sell",
    items: [
      { title: "Checkout", href: "/dashboard/checkout", icon: CreditCard },
      { title: "CRM", href: "/dashboard/crm", icon: Contact },
      { title: "Affiliate", href: "/dashboard/affiliate", icon: Handshake },
    ],
  },
  {
    title: "Automate",
    items: [
      { title: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
      { title: "Email", href: "/dashboard/email", icon: Mail },
      { title: "Automation", href: "/dashboard/automation", icon: Workflow },
    ],
  },
  {
    title: "Insights",
    items: [{ title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 }],
  },
  {
    title: "AI",
    items: [{ title: "AI Assistant", href: "/dashboard/ai", icon: Sparkles }],
  },
  {
    title: "Admin",
    items: [{ title: "Admin", href: "/dashboard/admin", icon: ShieldCheck }],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)
