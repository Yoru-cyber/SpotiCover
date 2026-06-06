import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccentColor = "green" | "blue" | "purple" | "orange" | "pink"
export type Language = "es" | "en"

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
      language: "es",
      setAccent: (accent) => set({ accent }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "spoti-cover-theme" }
  )
)
