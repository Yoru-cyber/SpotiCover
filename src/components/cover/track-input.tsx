"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { extractTrackId } from "@/lib/spotify"
import { useCoverStore } from "@/stores/cover-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TrackInput() {
  const [input, setInput] = useState("")
  const [validating, setValidating] = useState(false)
  const { setTrackId, setCoverData, setError, setIsGenerating } =
    useCoverStore()

  const error = useCoverStore((s) => s.error)

  const handleSubmit = async () => {
    const trackId = extractTrackId(input.trim())
    if (!trackId) {
      setError("Ingresa un ID o URL de Spotify válida")
      return
    }

    setError(null)
    setTrackId(trackId)
    setIsGenerating(true)
    setValidating(true)

    try {
      const res = await fetch(`/api/spotify/track/${trackId}`)
      if (!res.ok) {
        setError("Canción no encontrada. Verifica el enlace.")
        setIsGenerating(false)
        return
      }
      const data = await res.json()
      setCoverData(data)
    } catch {
      setError("Error al obtener los datos. Intenta de nuevo.")
    } finally {
      setValidating(false)
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-3"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Pega el enlace o ID de la canción..."
            className={cn(
              "w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background",
              "text-sm placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
              "transition-colors"
            )}
          />
        </div>
        <Button onClick={handleSubmit} disabled={validating || !input.trim()}>
          {validating ? "..." : "Generar"}
        </Button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-destructive text-center"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  )
}
