import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { refreshAccessToken, fetchUserTopTracks, fetchUserTopArtists } from "@/lib/spotify"
import type { TopTrack, TopArtist, StatsData, TimeRange } from "@/types/spotify"

const VALID_RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"]

const MOCK_TRACKS: TopTrack[] = [
  { name: "Blinding Lights", artists: "The Weeknd", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36", spotifyUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b" },
  { name: "Shape of You", artists: "Ed Sheeran", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96", spotifyUrl: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3" },
  { name: "Bohemian Rhapsody", artists: "Queen", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273e8b066f70e206e210e2f2bce", spotifyUrl: "https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb" },
  { name: "Stairway to Heaven", artists: "Led Zeppelin", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69", spotifyUrl: "https://open.spotify.com/track/5CQ30WqJwcep0pYcV4AMNc" },
  { name: "Hotel California", artists: "Eagles", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/40riOy7x9W7GXjyGp4pjAv" },
  { name: "Imagine", artists: "John Lennon", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/7pKfPomDEeI4VMHOJ3nB4p" },
  { name: "Smells Like Teen Spirit", artists: "Nirvana", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/5ghIJDpPoe3CfHMGu71E6T" },
  { name: "Billie Jean", artists: "Michael Jackson", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/5ChkMS8OtdzJeqyybCc9R5" },
  { name: "Sweet Child O' Mine", artists: "Guns N' Roses", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/7o2CTH4ct80mZt5D5wJ3df" },
  { name: "Yesterday", artists: "The Beatles", albumImageUrl: "https://i.scdn.co/image/ab67616d0000b273f2e5e0d7f7e8c5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/track/3BQHpFgAp4l80e1XslIjNI" },
]

const MOCK_ARTISTS: TopArtist[] = [
  { name: "The Weeknd", genres: ["pop", "r&b", "synth-pop"], imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7c6e0e5b5c5e5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ" },
  { name: "Ed Sheeran", genres: ["pop", "singer-songwriter", "folk-pop"], imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7c6e0e5b5c5e5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/artist/6eUKZXaKkcviH0Ku9w2n3V" },
  { name: "Queen", genres: ["rock", "classic rock", "glam rock"], imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7c6e0e5b5c5e5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/artist/1dfeR4HaWDbWqFHLkxsg1d" },
  { name: "Led Zeppelin", genres: ["rock", "hard rock", "blues rock"], imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7c6e0e5b5c5e5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/artist/36QJpDe2go2KgaRleHCDTp" },
  { name: "Michael Jackson", genres: ["pop", "r&b", "soul"], imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd7c6e0e5b5c5e5e5b5c5e5e5", spotifyUrl: "https://open.spotify.com/artist/3fMbdgg4jU18AjLCKBhRSm" },
]

const MOCK_GENRES = [
  { name: "pop", count: 8 },
  { name: "rock", count: 6 },
  { name: "r&b", count: 4 },
  { name: "synth-pop", count: 3 },
  { name: "singer-songwriter", count: 2 },
  { name: "classic rock", count: 2 },
  { name: "soul", count: 2 },
  { name: "folk-pop", count: 1 },
  { name: "hard rock", count: 1 },
  { name: "blues rock", count: 1 },
]

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const rawRange = req.nextUrl.searchParams.get("time_range")
    const timeRange: TimeRange = VALID_RANGES.includes(rawRange as TimeRange)
      ? (rawRange as TimeRange)
      : "short_term"

    const limit = timeRange === "short_term" ? 10 : timeRange === "medium_term" ? 8 : 6
    return NextResponse.json({
      tracks: MOCK_TRACKS.slice(0, limit),
      artists: MOCK_ARTISTS.slice(0, Math.ceil(limit / 2)),
      genres: MOCK_GENRES,
      timeRange,
    } satisfies StatsData)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = rateLimit({
    windowMs: 60_000,
    max: 20,
    identifier: `user-stats:${user.id}`,
  })

  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const rawRange = req.nextUrl.searchParams.get("time_range")
  const timeRange: TimeRange = VALID_RANGES.includes(rawRange as TimeRange)
    ? (rawRange as TimeRange)
    : "short_term"

  try {
    let token = await prisma.spotifyToken.findUnique({
      where: { userId: user.id },
    })

    if (!token) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 403 })
    }

    if (token.expiresAt <= new Date()) {
      const { accessToken, expiresAt } = await refreshAccessToken(token.refreshToken)
      token = await prisma.spotifyToken.update({
        where: { userId: user.id },
        data: { accessToken, expiresAt },
      })
    }

    const [rawTracks, rawArtists] = await Promise.all([
      fetchUserTopTracks(token.accessToken, timeRange, 20),
      fetchUserTopArtists(token.accessToken, timeRange, 10),
    ])

    const tracks: TopTrack[] = rawTracks.map((t) => ({
      name: t.name,
      artists: t.artists.map((a) => a.name).join(", "),
      albumImageUrl: t.album.images[0]?.url ?? null,
      spotifyUrl: t.external_urls.spotify,
    }))

    const artists: TopArtist[] = rawArtists.map((a) => ({
      name: a.name,
      genres: a.genres.slice(0, 3),
      imageUrl: a.images[0]?.url ?? null,
      spotifyUrl: a.external_urls.spotify,
    }))

    const genreMap = new Map<string, number>()
    for (const artist of rawArtists) {
      for (const genre of artist.genres) {
        genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1)
      }
    }

    const genres = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const stats: StatsData = { tracks, artists, genres, timeRange }

    return NextResponse.json(stats)
  } catch (err) {
    logger.error({ userId: user.id, error: err instanceof Error ? err.message : "Unknown error" }, "Failed to fetch user stats")
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 502 })
  }
}
