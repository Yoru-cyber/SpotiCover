"use client"

import { useState, useEffect } from "react"
import { BarChart3, ExternalLink, Loader2, Music } from "lucide-react"
import Link from "next/link"
import { useT } from "@/lib/i18n/use-t"
import { cn } from "@/lib/utils"
import type { StatsData } from "@/types/spotify"

export function SpotifyBanner() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const t = useT()

  useEffect(() => {
    fetch("/api/spotify/user-stats?time_range=short_term")
      .then(async (res) => {
        if (res.status === 403) {
          setConnected(false)
          return
        }
        if (!res.ok) {
          return
        }
        const data = await res.json()
        if (data.error) {
          return
        }
        setConnected(true)
        setStats(data)
      })
      .catch(() => {})
  }, [])

  if (connected === null) return null

  if (connected === false) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 max-w-md mx-auto">
        <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
          <Music className="size-5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t("stats.banner.connect")}</p>
          <p className="text-xs text-muted-foreground">{t("stats.banner.connect.desc")}</p>
        </div>
        <a
          href="/auth/spotify"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
        >
          {t("stats.connect.button")}
          <ExternalLink className="size-3" />
        </a>
      </div>
    )
  }

  if (!stats) return null

  const topTrack = stats.tracks[0]
  const topArtist = stats.artists[0]

  return (
    <Link href="/stats" className="block max-w-md mx-auto">
      <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <BarChart3 className="size-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("stats.banner.summary")}</p>
            <p className="text-xs text-muted-foreground">{t("stats.banner.summary.desc")}</p>
          </div>
          <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>

        <div className="space-y-2">
          {topTrack && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
              {topTrack.albumImageUrl && (
                <img
                  src={topTrack.albumImageUrl}
                  alt=""
                  className="size-10 rounded object-cover shrink-0"
                  crossOrigin="anonymous"
                />
              )}
              <div className="min-w-0">
                <p className={cn("text-xs font-medium truncate", !topTrack.albumImageUrl && "pl-1")}>
                  {topTrack.name}
                </p>
                <p className={cn("text-[11px] text-muted-foreground truncate", !topTrack.albumImageUrl && "pl-1")}>
                  {topTrack.artists}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">#1 {t("stats.banner.track")}</span>
            </div>
          )}

          {topArtist && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
              {topArtist.imageUrl && (
                <img
                  src={topArtist.imageUrl}
                  alt=""
                  className="size-10 rounded-full object-cover shrink-0"
                  crossOrigin="anonymous"
                />
              )}
              <div className="min-w-0">
                <p className={cn("text-xs font-medium truncate", !topArtist.imageUrl && "pl-1")}>
                  {topArtist.name}
                </p>
                <p className={cn("text-[11px] text-muted-foreground truncate", !topArtist.imageUrl && "pl-1")}>
                  {topArtist.genres.slice(0, 2).join(" · ") || t("stats.banner.artist")}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">#1 {t("stats.banner.artist")}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
