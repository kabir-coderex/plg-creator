"use client"

import { useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        document.documentElement.classList.toggle("dark")
        setDark((value) => !value)
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
