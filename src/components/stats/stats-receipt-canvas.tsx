"use client"

import { useRef, useEffect } from "react"
import type { StatsData, TimeRange } from "@/types/spotify"
import type { BgColor } from "@/stores/cover-store"

export type ReceiptMode = "all" | "tracks" | "artists" | "genres"

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

const modeConfig: Record<ReceiptMode, { W: number; H: number; label: string }> = {
  all: { W: 600, H: 900, label: "ALL STATS" },
  tracks: { W: 600, H: 520, label: "TOP TRACKS" },
  artists: { W: 600, H: 400, label: "TOP ARTISTS" },
  genres: { W: 600, H: 340, label: "TOP GENRES" },
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (ctx.measureText(t + "...").width > maxWidth && t.length > 0) t = t.slice(0, -1)
  return t + "..."
}

function drawHeader(ctx: CanvasRenderingContext2D, color: string, label: string, timeRange: TimeRange, W: number) {
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, 60)

  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, 4)

  ctx.fillStyle = color
  ctx.font = `bold 16px "Inter", system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText("SPOTICOVER", W / 2, 24)

  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.font = `bold 9px "Inter", system-ui, sans-serif`
  ctx.fillText(`${label} · ${timeRangeLabels[timeRange]}`, W / 2, 42)
}

function drawFooter(ctx: CanvasRenderingContext2D, color: string, W: number, H: number) {
  ctx.fillStyle = color
  ctx.fillRect(0, H - 4, W, 4)

  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.font = `8px "Inter", system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.fillText("https://spoti-cover-pearl.vercel.app/", W / 2, H - 14)
}

function drawTracks(ctx: CanvasRenderingContext2D, data: StatsData, color: string, W: number, startY: number, limit: number): number {
  const pad = 36
  let y = startY

  for (let i = 0; i < Math.min(data.tracks.length, limit); i++) {
    const track = data.tracks[i]
    const numStr = String(i + 1).padStart(2, "0")

    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.font = `bold 14px "Inter", system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText(numStr, pad, y)

    ctx.fillStyle = "white"
    ctx.font = `bold 11px "Inter", system-ui, sans-serif`
    const maxW = W - pad * 2 - 32 - 8
    ctx.fillText(truncateText(ctx, track.name, maxW), pad + 32, y - 2)

    ctx.fillStyle = "rgba(255,255,255,0.4)"
    ctx.font = `9px "Inter", system-ui, sans-serif`
    ctx.fillText(truncateText(ctx, track.artists, maxW), pad + 32, y + 11)

    y += 32
  }

  return y
}

function drawArtists(ctx: CanvasRenderingContext2D, data: StatsData, color: string, W: number, startY: number, limit: number): number {
  const pad = 36
  let y = startY

  for (let i = 0; i < Math.min(data.artists.length, limit); i++) {
    const artist = data.artists[i]
    const numStr = String(i + 1).padStart(2, "0")

    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.font = `bold 14px "Inter", system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText(numStr, pad, y)

    ctx.fillStyle = "white"
    ctx.font = `bold 11px "Inter", system-ui, sans-serif`
    ctx.fillText(artist.name, pad + 32, y - 2)

    const genreStr = artist.genres.join(" · ")
    if (genreStr) {
      ctx.fillStyle = "rgba(255,255,255,0.35)"
      ctx.font = `9px "Inter", system-ui, sans-serif`
      const maxW = W - pad * 2 - 32 - 8
      ctx.fillText(truncateText(ctx, genreStr, maxW), pad + 32, y + 11)
    }

    y += genreStr ? 32 : 24
  }

  return y
}

function drawGenres(ctx: CanvasRenderingContext2D, data: StatsData, color: string, W: number, startY: number): number {
  const pad = 36
  let y = startY
  let gx = pad

  ctx.textAlign = "center"
  for (let i = 0; i < Math.min(data.genres.length, 8); i++) {
    const g = data.genres[i]
    const pillText = `${g.name} ${g.count}`
    ctx.font = `10px "Inter", system-ui, sans-serif`
    const pillW = ctx.measureText(pillText).width + 20
    const pillH = 26

    if (gx + pillW > W - pad) {
      gx = pad
      y += pillH + 8
    }

    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.beginPath()
    ctx.roundRect(gx, y, pillW, pillH, 13)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.fillText(pillText, gx + pillW / 2, y + 17)

    gx += pillW + 8
  }

  return y + 30
}

function drawReceipt(
  ctx: CanvasRenderingContext2D,
  data: StatsData,
  bgColor: BgColor,
  customBgColor: string,
  mode: ReceiptMode
) {
  const color = bgColor === "custom" ? customBgColor : bgColors[bgColor]
  const { W, H, label } = modeConfig[mode]

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, H)

  drawHeader(ctx, color, label, data.timeRange, W)

  const pad = 36
  let y = 76

  if (mode === "all" || mode === "tracks") {
    ctx.fillStyle = color
    ctx.font = `bold 11px "Inter", system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText("TRACKS", pad, y)
    y += 8
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
    ctx.beginPath()
    ctx.moveTo(pad, y + 4)
    ctx.lineTo(W - pad, y + 4)
    ctx.stroke()
    y += 20

    y = drawTracks(ctx, data, color, W, y, mode === "all" ? 8 : 10)
    y += 12
  }

  if (mode === "all" || mode === "artists") {
    ctx.fillStyle = color
    ctx.font = `bold 11px "Inter", system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText("ARTISTS", pad, y)
    y += 8
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
    ctx.beginPath()
    ctx.moveTo(pad, y + 4)
    ctx.lineTo(W - pad, y + 4)
    ctx.stroke()
    y += 20

    y = drawArtists(ctx, data, color, W, y, mode === "all" ? 4 : 5)
    y += 12
  }

  if (mode === "all" || mode === "genres") {
    ctx.fillStyle = color
    ctx.font = `bold 11px "Inter", system-ui, sans-serif`
    ctx.textAlign = "left"
    ctx.fillText("GENRES", pad, y)
    y += 8
    ctx.strokeStyle = "rgba(255,255,255,0.06)"
    ctx.beginPath()
    ctx.moveTo(pad, y + 4)
    ctx.lineTo(W - pad, y + 4)
    ctx.stroke()
    y += 20

    y = drawGenres(ctx, data, color, W, y)
  }

  drawFooter(ctx, color, W, H)
}

interface StatsReceiptCanvasProps {
  data: StatsData
  bgColor: BgColor
  customBgColor: string
  mode: ReceiptMode
  onCanvas?: (canvas: HTMLCanvasElement) => void
}

export function StatsReceiptCanvas({ data, bgColor, customBgColor, mode, onCanvas }: StatsReceiptCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { W, H } = modeConfig[mode]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawReceipt(ctx, data, bgColor, customBgColor, mode)
    if (onCanvas) onCanvas(canvas)
  }, [data, bgColor, customBgColor, mode, onCanvas])

  return (
    <div className="w-full max-w-[320px] mx-auto overflow-hidden rounded-xl shadow-2xl">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto"
      />
    </div>
  )
}