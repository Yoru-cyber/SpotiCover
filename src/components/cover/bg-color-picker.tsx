"use client"

import { motion } from "framer-motion"
import { useCoverStore, type BgColor } from "@/stores/cover-store"
import { cn } from "@/lib/utils"
import { ColorPickerPopover } from "./color-picker-popover"
import { useT } from "@/lib/i18n/use-t"

const colorKeys: { key: BgColor; dictKey: "color.pink" | "color.blue" | "color.purple" | "color.orange" | "color.green" | "color.teal" | "color.slate"; bg: string }[] = [
  { key: "pink", dictKey: "color.pink", bg: "bg-pink-500" },
  { key: "blue", dictKey: "color.blue", bg: "bg-blue-500" },
  { key: "purple", dictKey: "color.purple", bg: "bg-purple-500" },
  { key: "orange", dictKey: "color.orange", bg: "bg-orange-500" },
  { key: "green", dictKey: "color.green", bg: "bg-green-500" },
  { key: "teal", dictKey: "color.teal", bg: "bg-teal-500" },
  { key: "slate", dictKey: "color.slate", bg: "bg-slate-500" },
]

export function BgColorPicker() {
  const bgColor = useCoverStore((s) => s.bgColor)
  const setBgColor = useCoverStore((s) => s.setBgColor)
  const t = useT()

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {colorKeys.map((c) => (
        <button
          key={c.key}
          onClick={() => setBgColor(c.key)}
          className={cn(
            "relative size-6 rounded-full transition-transform hover:scale-110",
            c.bg
          )}
          aria-label={t(c.dictKey)}
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