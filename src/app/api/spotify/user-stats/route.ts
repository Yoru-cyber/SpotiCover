import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  refreshAccessToken,
  fetchUserTopTracks,
  fetchUserTopArtists,
} from "@/lib/spotify";
import type {
  TopTrack,
  TopArtist,
  StatsData,
  TimeRange,
} from "@/types/spotify";

const VALID_RANGES: TimeRange[] = ["short_term", "medium_term", "long_term"];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit({
    windowMs: 60_000,
    max: 20,
    identifier: `user-stats:${user.id}`,
  });

  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawRange = req.nextUrl.searchParams.get("time_range");
  const timeRange: TimeRange = VALID_RANGES.includes(rawRange as TimeRange)
    ? (rawRange as TimeRange)
    : "short_term";

  try {
    let token = await prisma.spotifyToken.findUnique({
      where: { userId: user.id },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Spotify not connected" },
        { status: 403 },
      );
    }

    if (token.expiresAt <= new Date()) {
      const { accessToken, expiresAt } = await refreshAccessToken(
        token.refreshToken,
      );
      token = await prisma.spotifyToken.update({
        where: { userId: user.id },
        data: { accessToken, expiresAt },
      });
    }

    const [rawTracks, rawArtists] = await Promise.all([
      fetchUserTopTracks(token.accessToken, timeRange, 20),
      fetchUserTopArtists(token.accessToken, timeRange, 10),
    ]);

    const tracks: TopTrack[] = rawTracks.map((t) => ({
      name: t.name,
      artists: t.artists.map((a) => a.name).join(", "),
      albumImageUrl: t.album.images[0]?.url ?? null,
      spotifyUrl: t.external_urls.spotify,
    }));

    const artists: TopArtist[] = rawArtists.map((a) => ({
      name: a.name,
      genres: a.genres || [],
      imageUrl: a.images[0]?.url ?? null,
      spotifyUrl: a.external_urls.spotify,
    }));
    const genreMap = new Map<string, number>();
    for (const artist of rawArtists) {
      // Usamos el operador de encadenamiento opcional (?.) y fallback (|| [])
      const artistGenres = artist.genres || [];
      for (const genre of artistGenres) {
        if (genre) {
          // Asegurarnos de que el género no sea un string vacío
          genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
        }
      }
    }

    const genres = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const stats: StatsData = { tracks, artists, genres, timeRange };

    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(
      {
        userId: user.id,
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
      },
      "Failed to fetch user stats",
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
