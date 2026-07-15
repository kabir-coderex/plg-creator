export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <p>&copy; {new Date().getFullYear()} Skillguy. All rights reserved.</p>
        <p>Built for creators who talk to their business.</p>
      </div>
    </footer>
  )
}
