const TRACK_URL_REGEX = /spotify\.com\/track\/([a-zA-Z0-9]{22})/
const TRACK_ID_REGEX = /^[a-zA-Z0-9]{22}$/

export function extractTrackId(input: string): string | null {
  const urlMatch = input.match(TRACK_URL_REGEX)
  if (urlMatch) return urlMatch[1]
  if (TRACK_ID_REGEX.test(input)) return input
  return null
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(96)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier))
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function getSpotifyAuthUrl(codeChallenge: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!
  const scope = "user-top-read"

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope,
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}&scope=user-top-read`;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${errorBody}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Token refresh failed: ${res.status} ${errorBody}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

interface SpotifyApiTrack {
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  external_urls: { spotify: string }
}

interface SpotifyApiArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  external_urls: { spotify: string }
}

export async function fetchUserTopTracks(
  accessToken: string,
  timeRange: string,
  limit = 20
): Promise<SpotifyApiTrack[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch top tracks: ${res.status}`)
  }

  const data = await res.json()
  return data.items ?? []
}

export async function fetchUserTopArtists(
  accessToken: string,
  timeRange: string,
  limit = 10
): Promise<SpotifyApiArtist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch top artists: ${res.status}`)
  }

  const data = await res.json()
  return data.items ?? []
}
