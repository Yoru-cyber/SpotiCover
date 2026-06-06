"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { CoverData } from "@/types/spotify"
import type { BgColor } from "@/stores/cover-store"

const W = 1200
const H = 1200

const bgColors: Record<BgColor, string> = {
  pink: "#ec4899",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  orange: "#f97316",
  green: "#22c55e",
  teal: "#14b8a6",
  slate: "#64748b",
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  data: CoverData,
  bgColor: BgColor
) {
  const color = bgColors[bgColor]

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, color)
  grad.addColorStop(1, "rgba(0,0,0,0.3)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const imgSize = W * 0.55
  const imgX = (W - imgSize) / 2
  const imgY = H * 0.12

  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = data.albumImageUrl
  img.onload = () => {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 16)
    ctx.clip()
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
    ctx.restore()

    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 8
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 16)
    ctx.strokeStyle = "transparent"
    ctx.stroke()
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    drawText(ctx, data)
    drawAttribution(ctx)
  }

  if (img.complete) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 16)
    ctx.clip()
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
    ctx.restore()
    drawText(ctx, data)
    drawAttribution(ctx)
  }
}

function drawText(ctx: CanvasRenderingContext2D, data: CoverData) {
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  ctx.fillStyle = "white"
  ctx.font = `bold 40px "Inter", system-ui, sans-serif`
  wrapText(ctx, data.trackName, W / 2, H * 0.74, W * 0.8, 48)

  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.font = `28px "Inter", system-ui, sans-serif`
  wrapText(ctx, data.artistName, W / 2, H * 0.74 + 56 + 16, W * 0.8, 34)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ")
  let line = ""
  let ly = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, ly)
      line = word
      ly += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, ly)
}

function drawAttribution(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.font = `18px "Inter", system-ui, sans-serif`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.fillText("Listen on Spotify", W - 24, H - 24)
}

interface CoverCanvasProps {
  data: CoverData
  bgColor: BgColor
  onCanvas?: (canvas: HTMLCanvasElement) => void
}

export function CoverCanvas({ data, bgColor, onCanvas }: CoverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawCover(ctx, data, bgColor)
    if (onCanvas) onCanvas(canvas)
  }, [data, bgColor, onCanvas])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[420px] mx-auto aspect-square rounded-xl overflow-hidden shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-full"
      />
    </motion.div>
  )
}