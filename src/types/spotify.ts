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
  dominantColor: string
}
