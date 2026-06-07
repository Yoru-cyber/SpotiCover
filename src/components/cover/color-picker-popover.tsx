"use client"

import { motion } from "framer-motion"
import { useState, useRef, useEffect, useCallback } from "react"
import { HexColorPicker } from "react-colorful"
import { Pipette } from "lucide-react"
import { useCoverStore } from "@/stores/cover-store"
import { cn } from "@/lib/utils"

function hexToRgb(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function clamp(v: number) {
  return Math.min(255, Math.max(0, v))
}

export function ColorPickerPopover() {
  const bgColor = useCoverStore((s) => s.bgColor)
  const customBgColor = useCoverStore((s) => s.customBgColor)
  const showSpotifyCode = useCoverStore((s) => s.showSpotifyCode)
  const setCustomBgColor = useCoverStore((s) => s.setCustomBgColor)
  const setBgColor = useCoverStore((s) => s.setBgColor)

  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(customBgColor)
  const [rgbInput, setRgbInput] = useState(() => hexToRgb(customBgColor))
  const popoverRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    setHexInput(customBgColor)
    setRgbInput(hexToRgb(customBgColor))
  }, [open, customBgColor])

  const applyColor = useCallback(
    (color: string) => {
      setHexInput(color)
      setRgbInput(hexToRgb(color))

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (showSpotifyCode) {
        debounceRef.current = setTimeout(() => {
          setCustomBgColor(color)
          setBgColor("custom")
        }, 200)
      } else {
        setCustomBgColor(color)
        setBgColor("custom")
      }
    },
    [showSpotifyCode, setCustomBgColor, setBgColor],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      applyColor(val)
    }
  }

  function handleRgbChannel(channel: "r" | "g" | "b", raw: string) {
    const num = raw === "" ? 0 : clamp(Number(raw))
    const next = { ...rgbInput, [channel]: isNaN(num) ? 0 : num }
    setRgbInput(next)
    const hex = rgbToHex(next.r, next.g, next.b)
    applyColor(hex)
  }

  return (
    <div ref={popoverRef} className="relative">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => setOpen(!open)}
          className={cn("relative size-6 rounded-full transition-transform hover:scale-110")}
          style={{ backgroundColor: customBgColor }}
          aria-label="Custom color"
        >
          <Pipette className="absolute inset-0 size-full p-1 text-white drop-shadow-md" />
          {bgColor === "custom" && (
            <motion.div
              layoutId="bg-ring"
              className="absolute -inset-1 rounded-full ring-2 ring-white"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 flex flex-col items-center gap-2 p-3 rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <HexColorPicker color={customBgColor} onChange={applyColor} />
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Hex</span>
            <input
              value={hexInput}
              onChange={handleHexChange}
              className="w-24 h-7 rounded-md border border-input bg-background px-2 text-center text-xs font-mono"
              placeholder="#000000"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Rgb</span>
            {(["r", "g", "b"] as const).map((ch) => (
              <input
                key={ch}
                value={rgbInput[ch]}
                onChange={(e) => handleRgbChannel(ch, e.target.value)}
                className="w-12 h-7 rounded-md border border-input bg-background px-1 text-center text-xs font-mono"
                type="number"
                min={0}
                max={255}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}