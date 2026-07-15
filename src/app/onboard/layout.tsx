import { Sparkles } from "lucide-react"

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex items-center gap-2 font-semibold">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        Skillguy
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
