import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_TRACK_URL = "https://api.spotify.com/v1/tracks"
const TRACK_ID_REGEX = /^[a-zA-Z0-9]{22}$/

let cachedToken: { value: string; expiresAt: number } | null = null
let tokenPromise: Promise<string> | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  if (tokenPromise) {
    return tokenPromise
  }

  tokenPromise = (async () => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID!
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

      if (!clientId || !clientSecret) {
        throw new Error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not configured")
      }

      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

      const res = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      })

      if (!res.ok) {
        logger.error({ path: SPOTIFY_TOKEN_URL, error: `HTTP ${res.status}` }, "Spotify token request failed")
        throw new Error(`Spotify auth failed: ${res.status}`)
      }

      const data = await res.json()
      cachedToken = {
        value: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      }

      return cachedToken.value
    } finally {
      tokenPromise = null
    }
  })()

  return tokenPromise
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const path = req.nextUrl.pathname

  const rl = rateLimit({
    windowMs: 60_000,
    max: 30,
    identifier: `spotify-track:global`,
  })

  if (rl.limited) {
    logger.warn({ path }, "Rate limit exceeded for Spotify track lookup")
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    )
  }

  try {
    const { slug } = await params
    const trackId = slug[0]

    if (!trackId) {
      return NextResponse.json({ error: "Missing track ID" }, { status: 400 })
    }

    if (!TRACK_ID_REGEX.test(trackId)) {
      logger.warn({ path, error: trackId }, "Invalid track ID format")
      return NextResponse.json({ error: "Invalid track ID format" }, { status: 400 })
    }

    const token = await getAccessToken()

    const res = await fetch(`${SPOTIFY_TRACK_URL}/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      logger.warn({ path, error: `HTTP ${res.status}` }, "Spotify track lookup returned non-ok")
      return NextResponse.json(
        { error: "Track not found" },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const track = await res.json()

    const coverData = {
      trackName: track.name,
      artistName: track.artists.map((a: { name: string }) => a.name).join(", "),
      albumImageUrl: track.album.images[0]?.url ?? null,
      spotifyUrl: track.external_urls.spotify,
    }

    return NextResponse.json(coverData)
  } catch (err) {
    logger.error({ path, error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined }, "Unhandled error in Spotify track lookup")
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
