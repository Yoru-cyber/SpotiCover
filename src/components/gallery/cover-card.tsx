"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Download, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoverCardProps {
  id: string
  trackName: string
  artistName: string
  albumImageUrl: string
  spotifyUrl: string
  bucketPath: string
  bucketUrl: string
  onDelete: (id: string) => void
}

export function CoverCard({
  id,
  trackName,
  artistName,
  albumImageUrl,
  spotifyUrl,
  bucketPath,
  bucketUrl,
  onDelete,
}: CoverCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const thumbnailUrl = `${bucketUrl}/${bucketPath}`

  const handleEdit = () => {
    router.push(`/?trackId=${encodeURIComponent(spotifyUrl)}`)
  }

  const handlePreview = () => {
    window.open(thumbnailUrl, "_blank")
  }

  const handleDownload = useCallback(async () => {
    const res = await fetch(thumbnailUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = `${trackName}-spotify.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [thumbnailUrl, trackName])

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/covers/${id}`, { method: "DELETE" })
      if (res.ok) {
        onDelete(id)
      }
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md">
      <div className="aspect-square overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={`${trackName} cover`}
          className="size-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{trackName}</p>
        <p className="text-xs text-muted-foreground truncate">{artistName}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          onClick={handleDownload}
          size="icon"
          variant="secondary"
          className="size-9"
          title="Descargar"
        >
          <Download className="size-4" />
        </Button>
        <Button
          onClick={handlePreview}
          size="icon"
          variant="secondary"
          className="size-9"
          title="Vista previa"
        >
          <Eye className="size-4" />
        </Button>
        <Button
          onClick={handleEdit}
          size="icon"
          variant="secondary"
          className="size-9"
          title="Editar"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          onClick={handleDelete}
          size="icon"
          variant={confirming ? "destructive" : "secondary"}
          className="size-9"
          disabled={deleting}
          title="Eliminar"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {confirming && (
        <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 px-3 py-1.5 text-center">
          <p className="text-xs font-medium text-destructive-foreground">
            Presiona de nuevo para confirmar
          </p>
        </div>
      )}
    </div>
  )
}