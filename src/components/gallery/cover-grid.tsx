"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { CoverCard } from "./cover-card"

interface Cover {
  id: string
  trackName: string
  artistName: string
  albumImageUrl: string
  spotifyUrl: string
  bucketPath: string
  createdAt: string
}

export function CoverGrid() {
  const [covers, setCovers] = useState<Cover[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bucketUrl = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_URL!

  useEffect(() => {
    fetch("/api/covers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch covers")
        return res.json()
      })
      .then((data) => setCovers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (id: string) => {
    setCovers((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">Error al cargar: {error}</p>
      </div>
    )
  }

  if (covers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">No tienes portadas guardadas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Genera una portada y compártela para guardarla aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {covers.map((cover) => (
        <CoverCard
          key={cover.id}
          id={cover.id}
          trackName={cover.trackName}
          artistName={cover.artistName}
          albumImageUrl={cover.albumImageUrl}
          spotifyUrl={cover.spotifyUrl}
          bucketPath={cover.bucketPath}
          bucketUrl={bucketUrl}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}