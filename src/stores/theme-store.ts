import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccentColor = "green" | "blue" | "purple" | "orange" | "pink"
export type Language = "es" | "en"

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "es"
  const lang = navigator.language?.slice(0, 2)
  return lang === "en" ? "en" : "es"
}

interface ThemeState {
  accent: AccentColor
  language: Language
  setAccent: (accent: AccentColor) => void
  setLanguage: (language: Language) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent: "green",
      language: detectBrowserLanguage(),
      setAccent: (accent) => set({ accent }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "spoti-cover-theme" }
  )
)