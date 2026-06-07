"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/theme-store"

export function LangToggle() {
  const { language, setLanguage } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setLanguage(language === "es" ? "en" : "es")}
      aria-label={language === "es" ? "Switch to English" : "Cambiar a español"}
      className="font-medium text-xs w-8"
    >
      {language === "es" ? "EN" : "ES"}
    </Button>
  )
}