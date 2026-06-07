"use client"

import { Suspense, useEffect } from "react"
import { motion } from "framer-motion"
import { TrackInput } from "@/components/cover/track-input"
import { CoverPreview } from "@/components/cover/cover-preview"
import { useCoverStore } from "@/stores/cover-store"
import { useSearchParams } from "next/navigation"
import { useT } from "@/lib/i18n/use-t"

function HomeContent() {
  const coverData = useCoverStore((s) => s.coverData)
  const setTrackId = useCoverStore((s) => s.setTrackId)
  const searchParams = useSearchParams()
  const t = useT()

  useEffect(() => {
    const trackId = searchParams.get("trackId")
    if (trackId) {
      setTrackId(trackId)
    }
  }, [searchParams, setTrackId])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            {t("home.subtitle")}
          </p>
        </motion.div>

        <TrackInput />

        {coverData && <CoverPreview />}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}