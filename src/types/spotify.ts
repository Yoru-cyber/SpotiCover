export interface SpotifyArtist {
  name: string
}

export interface SpotifyAlbum {
  images: { url: string; height: number; width: number }[]
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  external_urls: { spotify: string }
}

export interface CoverData {
  trackName: string
  artistName: string
  albumImageUrl: string
  spotifyUrl: string
  dominantColor?: string
}

export type TimeRange = "short_term" | "medium_term" | "long_term"

export interface TopTrack {
  name: string
  artists: string
  albumImageUrl: string | null
  spotifyUrl: string
}

export interface TopArtist {
  name: string
  genres: string[]
  imageUrl: string | null
  spotifyUrl: string
}

export interface StatsData {
  tracks: TopTrack[]
  artists: TopArtist[]
  genres: { name: string; count: number }[]
  timeRange: TimeRange
}
