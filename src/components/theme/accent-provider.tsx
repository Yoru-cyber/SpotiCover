"use client"

import { useEffect } from "react"
import { useThemeStore, type AccentColor } from "@/stores/theme-store"

const accentVars: Record<AccentColor, Record<string, string>> = {
  green: {
    "--primary": "oklch(0.527 0.154 150.069)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": "oklch(0.527 0.154 150.069)",
  },
  blue: {
    "--primary": "oklch(0.546 0.185 255.558)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": "oklch(0.546 0.185 255.558)",
  },
  purple: {
    "--primary": "oklch(0.496 0.19 296.773)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": "oklch(0.496 0.19 296.773)",
  },
  orange: {
    "--primary": "oklch(0.571 0.176 45.6)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": "oklch(0.571 0.176 45.6)",
  },
  pink: {
    "--primary": "oklch(0.535 0.199 357.3)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--ring": "oklch(0.535 0.199 357.3)",
  },
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const accent = useThemeStore((s) => s.accent)

  useEffect(() => {
    const root = document.documentElement
    const vars = accentVars[accent]
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }, [accent])

  return <>{children}</>
}
