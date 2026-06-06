"use client"

import { motion } from "framer-motion"
import { useThemeStore, type AccentColor } from "@/stores/theme-store"
import { cn } from "@/lib/utils"

const colors: { key: AccentColor; label: string; bg: string }[] = [
  { key: "green", label: "Verde", bg: "bg-emerald-500" },
  { key: "blue", label: "Azul", bg: "bg-sky-500" },
  { key: "purple", label: "Púrpura", bg: "bg-violet-500" },
  { key: "orange", label: "Naranja", bg: "bg-amber-500" },
  { key: "pink", label: "Rosa", bg: "bg-pink-500" },
]

export function AccentPicker() {
  const { accent, setAccent } = useThemeStore()

  return (
    <div className="flex items-center gap-1">
      {colors.map((c) => (
        <button
          key={c.key}
          onClick={() => setAccent(c.key)}
          className={cn(
            "relative size-5 rounded-full transition-transform hover:scale-110",
            c.bg
          )}
          aria-label={`Color ${c.label}`}
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
