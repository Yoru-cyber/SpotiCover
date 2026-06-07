"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { extractTrackId } from "@/lib/spotify"
import { useCoverStore } from "@/stores/cover-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/use-t"

export function TrackInput() {
  const [input, setInput] = useState("")
  const [validating, setValidating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { trackId, setTrackId, setCoverData, setError, setIsGenerating } =
    useCoverStore()

  const error = useCoverStore((s) => s.error)
  const fetchingRef = useRef(false)
  const t = useT()

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchTrack = async (id: string) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    setError(null)
    setIsGenerating(true)
    setValidating(true)

    try {
      const res = await fetch(`/api/spotify/track/${id}`)
      if (!res.ok) {
        setError(t("track.error.notfound"))
        setIsGenerating(false)
        return
      }
      const data = await res.json()
      setCoverData(data)
    } catch {
      setError(t("track.error.fetch"))
    } finally {
      setValidating(false)
      setIsGenerating(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    if (trackId && trackId !== input) {
      const extracted = extractTrackId(trackId)
      if (extracted) {
        setInput(trackId)
        fetchTrack(extracted)
      }
    }
  }, [trackId])

  const handleSubmit = async () => {
    const trackId = extractTrackId(input.trim())
    if (!trackId) {
      setError(t("track.error.invalid"))
      return
    }

    setTrackId(trackId)
    await fetchTrack(trackId)
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
            placeholder={t("track.placeholder")}
            className={cn(
              "w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background",
              "text-sm placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
              "transition-colors"
            )}
          />
        </div>
        <Button onClick={handleSubmit} disabled={mounted && (validating || !input.trim())}>
          {validating ? "..." : t("track.submit")}
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