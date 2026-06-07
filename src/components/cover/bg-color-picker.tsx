"use client"

import { motion } from "framer-motion"
import { useCoverStore, type BgColor } from "@/stores/cover-store"
import { cn } from "@/lib/utils"
import { ColorPickerPopover } from "./color-picker-popover"

const colors: { key: BgColor; label: string; bg: string }[] = [
  { key: "pink", label: "Rosa", bg: "bg-pink-500" },
  { key: "blue", label: "Azul", bg: "bg-blue-500" },
  { key: "purple", label: "Púrpura", bg: "bg-purple-500" },
  { key: "orange", label: "Naranja", bg: "bg-orange-500" },
  { key: "green", label: "Verde", bg: "bg-green-500" },
  { key: "teal", label: "Teal", bg: "bg-teal-500" },
  { key: "slate", label: "Gris", bg: "bg-slate-500" },
]

export function BgColorPicker() {
  const bgColor = useCoverStore((s) => s.bgColor)
  const setBgColor = useCoverStore((s) => s.setBgColor)

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {colors.map((c) => (
        <button
          key={c.key}
          onClick={() => setBgColor(c.key)}
          className={cn(
            "relative size-6 rounded-full transition-transform hover:scale-110",
            c.bg
          )}
          aria-label={c.label}
        >
          {bgColor === c.key && (
            <motion.div
              layoutId="bg-ring"
              className="absolute -inset-1 rounded-full ring-2 ring-white"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
      <ColorPickerPopover />
    </div>
  )
}