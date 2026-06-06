"use client"

import { motion } from "framer-motion"
import { TrackInput } from "@/components/cover/track-input"
import { CoverPreview } from "@/components/cover/cover-preview"
import { useCoverStore } from "@/stores/cover-store"

export default function Home() {
  const coverData = useCoverStore((s) => s.coverData)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Crea tu portada de Spotify
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Pega el enlace de cualquier canción y genera una imagen
            personalizada para descargar o compartir.
          </p>
        </motion.div>

        <TrackInput />

        {coverData && <CoverPreview />}
      </div>
    </main>
  )
}