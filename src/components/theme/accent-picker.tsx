"use client"

import { motion } from "framer-motion"
import { useThemeStore, type AccentColor } from "@/stores/theme-store"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/use-t"

const colorKeys: { key: AccentColor; dictKey: "settings.accent.green" | "settings.accent.blue" | "settings.accent.purple" | "settings.accent.orange" | "settings.accent.pink"; bg: string }[] = [
  { key: "green", dictKey: "settings.accent.green", bg: "bg-emerald-500" },
  { key: "blue", dictKey: "settings.accent.blue", bg: "bg-sky-500" },
  { key: "purple", dictKey: "settings.accent.purple", bg: "bg-violet-500" },
  { key: "orange", dictKey: "settings.accent.orange", bg: "bg-amber-500" },
  { key: "pink", dictKey: "settings.accent.pink", bg: "bg-pink-500" },
]

export function AccentPicker() {
  const { accent, setAccent } = useThemeStore()
  const t = useT()

  return (
    <div className="flex items-center gap-1">
      {colorKeys.map((c) => (
        <button
          key={c.key}
          onClick={() => setAccent(c.key)}
          className={cn(
            "relative size-5 rounded-full transition-transform hover:scale-110",
            c.bg
          )}
          aria-label={t(c.dictKey)}
        >
          {accent === c.key && (
            <motion.div
              layoutId="accent-ring"
              className="absolute -inset-1 rounded-full ring-2 ring-foreground/40"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}