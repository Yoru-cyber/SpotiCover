"use client"

import { useT } from "@/lib/i18n/use-t"
import { Music } from "lucide-react"

export function ConnectSpotify() {
  const t = useT()

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center">
        <Music className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">{t("stats.connect.title")}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {t("stats.connect.description")}
      </p>
      <a
        href="/auth/spotify"
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium h-9 gap-1.5 px-4 hover:bg-primary/80 transition-colors"
      >
        {t("stats.connect.button")}
      </a>
    </div>
  )
}
