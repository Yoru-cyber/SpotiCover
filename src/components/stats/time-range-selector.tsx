"use client"

import type { TimeRange } from "@/types/spotify"
import { useT } from "@/lib/i18n/use-t"
import { cn } from "@/lib/utils"
import type { DictKey } from "@/lib/i18n/dict"

const rangeKeys: Record<TimeRange, DictKey> = {
  short_term: "stats.range.4weeks",
  medium_term: "stats.range.6months",
  long_term: "stats.range.alltime",
}

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  loading?: boolean
}

export function TimeRangeSelector({ value, onChange, loading }: TimeRangeSelectorProps) {
  const t = useT()

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
      {(Object.entries(rangeKeys) as [TimeRange, DictKey][]).map(([range, key]) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          disabled={loading}
          className={cn(
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === range
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
