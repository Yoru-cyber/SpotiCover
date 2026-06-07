"use client"

import { useEffect } from "react"
import { useThemeStore } from "@/stores/theme-store"

export function LangProvider({ children }: { children: React.ReactNode }) {
  const language = useThemeStore((s) => s.language)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <>{children}</>
}