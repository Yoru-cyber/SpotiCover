import { create } from "zustand"
import type { CoverData } from "@/types/spotify"

export type BgColor = "pink" | "blue" | "purple" | "orange" | "green" | "teal" | "slate"

interface CoverState {
  trackId: string | null
  coverData: CoverData | null
  bgColor: BgColor
  isGenerating: boolean
  isDownloading: boolean
  isUploading: boolean
  shareUrl: string | null
  error: string | null
  setTrackId: (id: string) => void
  setCoverData: (data: CoverData) => void
  setBgColor: (color: BgColor) => void
  setIsGenerating: (value: boolean) => void
  setIsDownloading: (value: boolean) => void
  setIsUploading: (value: boolean) => void
  setShareUrl: (url: string | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  trackId: null,
  coverData: null,
  bgColor: "pink" as BgColor,
  isGenerating: false,
  isDownloading: false,
  isUploading: false,
  shareUrl: null,
  error: null,
}

export const useCoverStore = create<CoverState>((set) => ({
  ...initialState,
  setTrackId: (trackId) => set({ trackId }),
  setCoverData: (coverData) => set({ coverData }),
  setBgColor: (bgColor) => set({ bgColor }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setShareUrl: (shareUrl) => set({ shareUrl }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
