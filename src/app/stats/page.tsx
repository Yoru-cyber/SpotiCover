"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectSpotify } from "@/components/stats/connect-spotify"
import { TimeRangeSelector } from "@/components/stats/time-range-selector"
import { StatsReceiptCanvas, type ReceiptMode } from "@/components/stats/stats-receipt-canvas"
import { BgColorPicker } from "@/components/cover/bg-color-picker"
import { useCoverStore } from "@/stores/cover-store"
import { useT } from "@/lib/i18n/use-t"
import type { StatsData, TimeRange } from "@/types/spotify"

const modes: { mode: ReceiptMode; labelKey: string; fileSuffix: string }[] = [
  { mode: "all", labelKey: "stats.mode.all", fileSuffix: "all" },
  { mode: "tracks", labelKey: "stats.mode.tracks", fileSuffix: "tracks" },
  { mode: "artists", labelKey: "stats.mode.artists", fileSuffix: "artists" },
  { mode: "genres", labelKey: "stats.mode.genres", fileSuffix: "genres" },
]

export default function StatsPage() {
  const bgColor = useCoverStore((s) => s.bgColor)
  const customBgColor = useCoverStore((s) => s.customBgColor)

  const [connected, setConnected] = useState<boolean | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("short_term")
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const t = useT()

  const fetchStats = useCallback(async (range: TimeRange) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/spotify/user-stats?time_range=${range}`)
      if (res.status === 403) {
        setConnected(false)
        setStats(null)
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setConnected(true)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(timeRange)
  }, [timeRange, fetchStats])

  const handleCanvasReady = useCallback((mode: string) => (canvas: HTMLCanvasElement) => {
    canvasRefs.current.set(mode, canvas)
  }, [])

  const handleDownload = useCallback(async (mode: string, suffix: string) => {
    if (downloading) return
    setDownloading(mode)
    try {
      const canvas = canvasRefs.current.get(mode)
      if (!canvas) return
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `spotify-stats-${suffix}-${timeRange}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(null)
    }
  }, [downloading, timeRange])

  if (connected === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (connected === false) {
    return <ConnectSpotify />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("stats.subtitle")}</p>
      </div>

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} loading={loading} />

      {error && (
        <p className="text-sm text-destructive text-center">{t("stats.error")}: {error}</p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {stats && !loading && (
        <>
          <div className="flex justify-center">
            <BgColorPicker />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {modes.map(({ mode, labelKey, fileSuffix }) => (
              <div key={mode} className="flex flex-col items-center gap-3">
                <StatsReceiptCanvas
                  data={stats}
                  bgColor={bgColor}
                  customBgColor={customBgColor}
                  mode={mode}
                  onCanvas={handleCanvasReady(mode)}
                />
                <Button
                  onClick={() => handleDownload(mode, fileSuffix)}
                  disabled={downloading === mode}
                  size="sm"
                  variant="secondary"
                >
                  <Download className="size-3.5" />
                  {downloading === mode ? t("stats.downloading") : t("stats.download")}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}