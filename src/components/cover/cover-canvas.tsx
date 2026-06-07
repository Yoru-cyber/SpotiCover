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
  custom: "#ec4899",
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  data: CoverData,
  bgColor: BgColor,
  customBgColor: string,
  showSpotifyCode: boolean
) {
  const color = bgColor === "custom" ? customBgColor : bgColors[bgColor]

  // Forzar suavizado de alta calidad al redimensionar para el contenedor de 420px
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, color)
  grad.addColorStop(1, "rgba(0,0,0,0.4)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const imgSize = W * 0.55
  const imgX = (W - imgSize) / 2
  const imgY = H * 0.12

  const img = new Image()
  img.crossOrigin = "anonymous"

  let corsFailed = false

  const renderAll = () => {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    if (corsFailed) {
      drawFallbackCover(ctx, data, imgX, imgY, imgSize)
    } else {
      drawClippedImage(ctx, img, imgX, imgY, imgSize)
    }
    drawText(ctx, data)
    if (showSpotifyCode) drawAttribution(ctx, data, color)
  }

  img.onerror = () => {
    if (img.crossOrigin === "anonymous") {
      img.crossOrigin = null
      corsFailed = true
      img.src = data.albumImageUrl
    } else {
      corsFailed = true
      renderAll()
    }
  }

  img.onload = () => {
    if (!corsFailed || img.crossOrigin !== "anonymous") {
      renderAll()
    }
  }
  img.src = data.albumImageUrl
}

function drawClippedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 32)
  ctx.clip()
  try {
    ctx.drawImage(img, x, y, size, size)
  } catch (e) {
    ctx.fillStyle = "rgba(255,255,255,0.1)"
    ctx.fillRect(x, y, size, size)
  }
  ctx.restore()

  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 32)
  ctx.strokeStyle = "transparent"
  ctx.stroke()
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

function drawFallbackCover(
  ctx: CanvasRenderingContext2D,
  _data: CoverData,
  x: number,
  y: number,
  size: number
) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 32)
  ctx.clip()
  ctx.fillStyle = "rgba(255,255,255,0.08)"
  ctx.fillRect(x, y, size, size)
  ctx.restore()
}

function drawText(ctx: CanvasRenderingContext2D, data: CoverData) {
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  ctx.fillStyle = "white"
  ctx.font = `bold 52px "Inter", system-ui, sans-serif`
  wrapText(ctx, data.trackName, W / 2, H * 0.72, W * 0.85, 64)

  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.font = `36px "Inter", system-ui, sans-serif`
  wrapText(ctx, data.artistName, W / 2, H * 0.72 + 110, W * 0.85, 46)
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

// PASO 2: Recibimos el string del color aquí
function drawAttribution(ctx: CanvasRenderingContext2D, data: CoverData, hexColor: string) {
  const textString = "Listen on Spotify"
  const logoSize = 48 
  const gap = 20 

  // Configuración base de tipografía para medir
  ctx.font = `40px "Inter", system-ui, sans-serif`
  const textWidth = ctx.measureText(textString).width
  
  // Calculamos el bloque unificado (Logo + Espacio + Texto) alineado a la derecha de forma consistente
  const totalWidth = logoSize + gap + textWidth
  const groupX = W - totalWidth - 60
  const groupY = H - 60

  // 1. Render de Texto unificado
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.textAlign = "left" 
  ctx.textBaseline = "bottom"
  ctx.fillText(textString, groupX + logoSize + gap, groupY - 60)

  // 2. Extracción e inyección del código Scannable integrado
  const trackIdMatch = data.spotifyUrl?.match(/track\/([a-zA-Z0-9]+)/)
  const trackId = trackIdMatch ? trackIdMatch[1] : null

  if (trackId) {
    // 3. Limpiamos el color quitándole el '#' para enviarlo seguro a la API de Spotify
    const darkenHex = (hex: string, factor = 0.9) => {
      const num = parseInt(hex, 16);
      const r = Math.floor(((num >> 16) & 0xFF) * factor);
      const g = Math.floor(((num >> 8) & 0xFF) * factor);
      const b = Math.floor((num & 0xFF) * factor);
      return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    const cleanHex = darkenHex(hexColor.replace("#", ""), 0.5);
    const codeImg = new Image()
    codeImg.crossOrigin = "anonymous"
    
    // 4. Inyectamos el color dinámico en el slot de las barras, y le ponemos barras blancas
    codeImg.src = `https://scannables.scdn.co/uri/plain/png/${cleanHex}/white/400/spotify:track:${trackId}`
    
    const codeWidth = 240 
    const codeHeight = 60

    // 5. Posición alineada simétricamente encima de nuestro bloque unificado
    const codeX = W - codeWidth - 100
    const codeY = groupY - codeHeight + 20

    const renderCode = () => {
      ctx.drawImage(codeImg, codeX, codeY, codeWidth, codeHeight)
    }
    codeImg.onload = renderCode
    if (codeImg.complete) renderCode()
  }
}

interface CoverCanvasProps {
  data: CoverData
  bgColor: BgColor
  customBgColor: string
  showSpotifyCode: boolean
  onCanvas?: (canvas: HTMLCanvasElement) => void
}

export function CoverCanvas({ data, bgColor, customBgColor, showSpotifyCode, onCanvas }: CoverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawCover(ctx, data, bgColor, customBgColor, showSpotifyCode)
    if (onCanvas) onCanvas(canvas)
  }, [data, bgColor, customBgColor, showSpotifyCode, onCanvas])

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