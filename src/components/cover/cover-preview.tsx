"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Share2, Check, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCoverStore } from "@/stores/cover-store"
import { supabase } from "@/lib/supabase/client"
import { BgColorPicker } from "./bg-color-picker"
import { CoverCanvas } from "./cover-canvas"
import { ShareSheet } from "./share-sheet"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/use-t"

export function CoverPreview() {
  const coverData = useCoverStore((s) => s.coverData)
  const bgColor = useCoverStore((s) => s.bgColor)
  const customBgColor = useCoverStore((s) => s.customBgColor)
  const showSpotifyCode = useCoverStore((s) => s.showSpotifyCode)
  const setShowSpotifyCode = useCoverStore((s) => s.setShowSpotifyCode)
  const isGenerating = useCoverStore((s) => s.isGenerating)
  const isUploading = useCoverStore((s) => s.isUploading)
  const setIsUploading = useCoverStore((s) => s.setIsUploading)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const t = useT()

  useEffect(() => {
    setUploadedUrl(null)
  }, [coverData])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
  }, [])

  const getBlob = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    )
  }, [])

  const handleDownload = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await getBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `${coverData?.trackName ?? "cover"}-spotify.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }, [coverData, downloading, getBlob])

  const handleShare = useCallback(async () => {
    if (!coverData || isUploading) return

    if (uploadedUrl) {
      setShareOpen(true)
      return
    }

    setIsUploading(true)
    try {
      const blob = await getBlob()
      if (!blob) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        handleDownload()
        return
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.png`

      const { error: uploadError } = await supabase.storage
        .from("user_covers")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: false,
        })

      if (uploadError) {
        handleDownload()
        return
      }

      const bucketUrl = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_URL!
      const url = `${bucketUrl}/${filePath}`
      setUploadedUrl(url)
      setShareOpen(true)

      await fetch("/api/covers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackName: coverData.trackName,
          artistName: coverData.artistName,
          albumImageUrl: coverData.albumImageUrl,
          spotifyUrl: coverData.spotifyUrl,
          bucketPath: filePath,
        }),
      })
    } catch {
      handleDownload()
    } finally {
      setIsUploading(false)
    }
  }, [coverData, isUploading, uploadedUrl, getBlob, setIsUploading, handleDownload])

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="size-8 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  if (!coverData) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center gap-4">
        <BgColorPicker />
        <div className="w-full max-w-[420px] mx-auto">
          <CoverCanvas data={coverData} bgColor={bgColor} customBgColor={customBgColor} showSpotifyCode={showSpotifyCode} onCanvas={handleCanvasReady} />
        </div>
        <button
          onClick={() => setShowSpotifyCode(!showSpotifyCode)}
          className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none"
        >
          <span
            className={cn(
              "relative size-4 rounded border transition-colors",
              showSpotifyCode ? "bg-primary border-primary" : "border-border"
            )}
          >
            {showSpotifyCode && (
              <Check className="absolute inset-0 size-full p-0.5 text-primary-foreground" />
            )}
          </span>
          <QrCode className="size-4" />
          {t("cover.showCode")}
        </button>
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="secondary"
          size="sm"
        >
          <Download className="size-4" />
          {downloading ? t("cover.downloading") : t("cover.download")}
        </Button>
        <Button onClick={handleShare} disabled={isUploading || downloading} size="sm">
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("cover.uploading")}
            </>
          ) : (
            <>
              <Share2 className="size-4" />
              {t("cover.share")}
            </>
          )}
        </Button>
      </div>

      {uploadedUrl && coverData && (
        <ShareSheet
          imageUrl={uploadedUrl}
          trackName={coverData.trackName}
          artistName={coverData.artistName}
          spotifyUrl={coverData.spotifyUrl}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </motion.div>
  )
}