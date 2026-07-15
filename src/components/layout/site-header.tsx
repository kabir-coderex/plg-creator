import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const LINKS = [
  { title: "Product", href: "#product" },
  { title: "Connect AI", href: "#connect-ai" },
  { title: "Modules", href: "#modules" },
  { title: "Pricing", href: "#pricing" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          Skillguy
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button render={<Link href="/signup" />}>Get started</Button>
        </div>
      </div>
    </header>
  )
}
