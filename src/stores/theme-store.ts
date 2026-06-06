import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccentColor = "green" | "blue" | "purple" | "orange" | "pink"

interface ThemeState {
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent: "green",
      setAccent: (accent) => set({ accent }),
    }),
    { name: "spoti-cover-theme" }
  )
)
