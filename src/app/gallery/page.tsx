"use client"

import { CoverGrid } from "@/components/gallery/cover-grid"
import { useT } from "@/lib/i18n/use-t"

export default function GalleryPage() {
  const t = useT()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("gallery.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("gallery.subtitle")}
          </p>
        </div>
        <CoverGrid />
      </div>
    </main>
  )
}