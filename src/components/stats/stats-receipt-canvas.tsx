"use client"

import { useRef, useEffect, useCallback } from "react"
import type { StatsData, TimeRange } from "@/types/spotify"
import type { BgColor } from "@/stores/cover-store"

const W = 800
const H = 1600

const bgColors: Record<BgColor, string> = {
  pink: "#ec4899",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  orange: "#f97316",
  green: "#22c55e",
  teal: "#14b8a6",
  slate: "#64748b",
  custom: "#ec4899",
}

const timeRangeLabels: Record<TimeRange, string> = {
  short_term: "LAST 4 WEEKS",
  medium_term: "LAST 6 MONTHS",
  long_term: "ALL TIME",
}

function drawReceipt(
  ctx: CanvasRenderingContext2D,
  data: StatsData,
  bgColor: BgColor,
  customBgColor: string
) {
  const color = bgColor === "custom" ? customBgColor : bgColors[bgColor]

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Background
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, H)

  // Accent header strip
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, color)
  grad.addColorStop(0.5, color)
  grad.addColorStop(1, "#0a0a0a")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 8)

  const pad = 60
  let y = 60

  // Header
  ctx.fillStyle = color
  ctx.font = `bold 24px "Inter", system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText("SPOTICOVER", W / 2, y)
  y += 32

  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.font = `bold 14px "Inter", system-ui, sans-serif`
  ctx.fillText("MUSIC STATISTICS", W / 2, y)
  y += 28

  ctx.fillStyle = color
  ctx.font = `bold 11px "Inter", system-ui, sans-serif`
  ctx.fillText(timeRangeLabels[data.timeRange], W / 2, y)
  y += 8

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.1)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, y + 24)
  ctx.lineTo(W - pad, y + 24)
  ctx.stroke()
  y += 48

  // Date
  ctx.fillStyle = "rgba(255,255,255,0.3)"
  ctx.font = `10px "Inter", system-ui, sans-serif`
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  ctx.fillText(dateStr.toUpperCase(), W / 2, y)
  y += 10

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.1)"
  ctx.beginPath()
  ctx.moveTo(pad, y + 14)
  ctx.lineTo(W - pad, y + 14)
  ctx.stroke()
  y += 40

  // ── TOP TRACKS ──
  ctx.textAlign = "left"
  ctx.fillStyle = color
  ctx.font = `bold 16px "Inter", system-ui, sans-serif`
  ctx.fillText("TOP TRACKS", pad, y)
  y += 12

  ctx.strokeStyle = "rgba(255,255,255,0.06)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, y + 6)
  ctx.lineTo(W - pad, y + 6)
  ctx.stroke()
  y += 28

  const tracksLimit = Math.min(data.tracks.length, 10)
  for (let i = 0; i < tracksLimit; i++) {
    const track = data.tracks[i]
    const numStr = String(i + 1).padStart(2, "0")

    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.font = `bold 20px "Inter", system-ui, sans-serif`
    ctx.fillText(numStr, pad, y)

    ctx.fillStyle = "white"
    ctx.font = `bold 15px "Inter", system-ui, sans-serif`
    const maxTrackW = W - pad * 2 - 42 - 12
    const trackName = truncateText(ctx, track.name, maxTrackW)
    ctx.fillText(trackName, pad + 42, y - 4)

    ctx.fillStyle = "rgba(255,255,255,0.45)"
    ctx.font = `12px "Inter", system-ui, sans-serif`
    const artistName = truncateText(ctx, track.artists, maxTrackW)
    ctx.fillText(artistName, pad + 42, y + 14)

    y += 44
    if (y > H - 340) break
  }

  // ── TOP ARTISTS ──
  y += 16

  ctx.fillStyle = color
  ctx.font = `bold 16px "Inter", system-ui, sans-serif`
  ctx.fillText("TOP ARTISTS", pad, y)
  y += 12

  ctx.strokeStyle = "rgba(255,255,255,0.06)"
  ctx.beginPath()
  ctx.moveTo(pad, y + 6)
  ctx.lineTo(W - pad, y + 6)
  ctx.stroke()
  y += 28

  const artistsLimit = Math.min(data.artists.length, 5)
  for (let i = 0; i < artistsLimit; i++) {
    const artist = data.artists[i]
    const numStr = String(i + 1).padStart(2, "0")

    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.font = `bold 20px "Inter", system-ui, sans-serif`
    ctx.fillText(numStr, pad, y)

    ctx.fillStyle = "white"
    ctx.font = `bold 14px "Inter", system-ui, sans-serif`
    ctx.fillText(artist.name, pad + 42, y - 4)

    const genreStr = artist.genres.join(" · ")
    if (genreStr) {
      ctx.fillStyle = "rgba(255,255,255,0.35)"
      ctx.font = `11px "Inter", system-ui, sans-serif`
      const maxW = W - pad * 2 - 42 - 12
      ctx.fillText(truncateText(ctx, genreStr, maxW), pad + 42, y + 14)
    }

    y += artist.genres.length > 0 ? 44 : 34
    if (y > H - 240) break
  }

  // ── TOP GENRES ──
  y += 16

  ctx.fillStyle = color
  ctx.font = `bold 16px "Inter", system-ui, sans-serif`
  ctx.fillText("TOP GENRES", pad, y)
  y += 12

  ctx.strokeStyle = "rgba(255,255,255,0.06)"
  ctx.beginPath()
  ctx.moveTo(pad, y + 6)
  ctx.lineTo(W - pad, y + 6)
  ctx.stroke()
  y += 28

  const genreItems = data.genres.slice(0, 8)
  ctx.textAlign = "center"
  let gx = pad
  const genreY = y
  for (let i = 0; i < genreItems.length; i++) {
    const g = genreItems[i]
    const pillText = `${g.name} (${g.count})`
    ctx.font = `12px "Inter", system-ui, sans-serif`
    const pillW = ctx.measureText(pillText).width + 24
    const pillH = 30

    if (gx + pillW > W - pad) {
      gx = pad
      y += pillH + 10
    }

    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.beginPath()
    ctx.roundRect(gx, y, pillW, pillH, 15)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.font = `12px "Inter", system-ui, sans-serif`
    ctx.fillText(pillText, gx + pillW / 2, y + 20)

    gx += pillW + 10
  }

  if (gx > pad) {
    y += 42
  } else {
    y = genreY + 42
  }

  // ── FOOTER ──
  y = Math.max(y, H - 120)

  ctx.strokeStyle = "rgba(255,255,255,0.1)"
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()
  y += 30

  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.font = `11px "Inter", system-ui, sans-serif`
  ctx.fillText("THANK YOU FOR LISTENING", W / 2, y)
  y += 20

  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.font = `10px "Inter", system-ui, sans-serif`
  ctx.fillText("spoticover.app", W / 2, y)
  y += 7

  ctx.fillStyle = "rgba(255,255,255,0.08)"
  ctx.font = `9px "Inter", system-ui, sans-serif`
  ctx.fillText(`GENERATED ${dateStr.toUpperCase()}`, W / 2, y)

  // Bottom accent
  ctx.fillStyle = color
  ctx.fillRect(0, H - 4, W, 4)
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + "..."
}

interface StatsReceiptCanvasProps {
  data: StatsData
  bgColor: BgColor
  customBgColor: string
  onCanvas?: (canvas: HTMLCanvasElement) => void
}

export function StatsReceiptCanvas({ data, bgColor, customBgColor, onCanvas }: StatsReceiptCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawReceipt(ctx, data, bgColor, customBgColor)
    if (onCanvas) onCanvas(canvas)
  }, [data, bgColor, customBgColor, onCanvas])

  return (
    <div className="w-full max-w-[400px] mx-auto overflow-hidden rounded-xl shadow-2xl">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto"
      />
    </div>
  )
}
