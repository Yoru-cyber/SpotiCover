"use client"

import type { ReceiptMode } from "@/components/stats/stats-receipt-canvas"
import { useT } from "@/lib/i18n/use-t"
import { cn } from "@/lib/utils"
import type { DictKey } from "@/lib/i18n/dict"

const modeKeys: Record<ReceiptMode, DictKey> = {
  all: "stats.mode.all",
  tracks: "stats.mode.tracks",
  artists: "stats.mode.artists",
  genres: "stats.mode.genres",
}

interface ModeSelectorProps {
  value: ReceiptMode
  onChange: (mode: ReceiptMode) => void
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const t = useT()

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
      {(Object.entries(modeKeys) as [ReceiptMode, DictKey][]).map(([mode, key]) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )
}