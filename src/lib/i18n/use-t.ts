import { useThemeStore } from "@/stores/theme-store"
import { dict, type DictKey } from "./dict"

export function useT() {
  const language = useThemeStore((s) => s.language)

  return (key: DictKey): string => {
    return dict[key][language]
  }
}

export function t(language: "es" | "en", key: DictKey): string {
  return dict[key][language]
}