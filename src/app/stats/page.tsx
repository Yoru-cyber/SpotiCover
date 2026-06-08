"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectSpotify } from "@/components/stats/connect-spotify"
import { TimeRangeSelector } from "@/components/stats/time-range-selector"
import { ModeSelector } from "@/components/stats/mode-selector"
import { StatsReceiptCanvas, type ReceiptMode } from "@/components/stats/stats-receipt-canvas"
import { BgColorPicker } from "@/components/cover/bg-color-picker"
import { useCoverStore } from "@/stores/cover-store"
import { useT } from "@/lib/i18n/use-t"
import type { StatsData, TimeRange } from "@/types/spotify"

const fileSuffix: Record<ReceiptMode, string> = {
  all: "all",
  tracks: "tracks",
  artists: "artists",
  genres: "genres",
}

export default function StatsPage() {
  const bgColor = useCoverStore((s) => s.bgColor)
  const customBgColor = useCoverStore((s) => s.customBgColor)

  const [connected, setConnected] = useState<boolean | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("short_term")
  const [mode, setMode] = useState<ReceiptMode>("all")
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
  }, [])

  const handleDownload = useCallback(async () => {
    if (downloading || !canvasRef.current) return
    setDownloading(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, "image/png")
      )
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `spotify-stats-${fileSuffix[mode]}-${timeRange}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }, [downloading, mode, timeRange])

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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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
          <div className="flex flex-col items-center gap-4">
            <BgColorPicker />
            <ModeSelector value={mode} onChange={setMode} />
            <StatsReceiptCanvas
              data={stats}
              bgColor={bgColor}
              customBgColor={customBgColor}
              mode={mode}
              onCanvas={handleCanvasReady}
            />
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={handleDownload} disabled={downloading} size="sm">
              <Download className="size-4" />
              {downloading ? t("stats.downloading") : t("stats.download")}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}