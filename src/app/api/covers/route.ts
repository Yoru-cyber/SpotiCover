import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

function validateString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    return null
  }
  return value.trim()
}

function validateUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    if (!["http:", "https:"].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = rateLimit({
    windowMs: 60_000,
    max: 60,
    identifier: `covers-get:${user.id}`,
  })

  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const covers = await prisma.cover.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(covers)
  } catch (err) {
    logger.error({ userId: user.id, path: req.nextUrl.pathname, error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined }, "Failed to fetch covers")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = rateLimit({
    windowMs: 60_000,
    max: 10,
    identifier: `covers-post:${user.id}`,
  })

  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const raw = body as Record<string, unknown>

  const trackName = validateString(raw.trackName, 500)
  const artistName = validateString(raw.artistName, 500)
  const albumImageUrl = validateUrl(raw.albumImageUrl)
  const spotifyUrl = validateUrl(raw.spotifyUrl)
  const bucketPath = validateString(raw.bucketPath, 200)

  if (!trackName || !artistName || !albumImageUrl || !spotifyUrl || !bucketPath) {
    return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 })
  }

  try {
    const cover = await prisma.cover.create({
      data: {
        userId: user.id,
        trackName,
        artistName,
        albumImageUrl,
        spotifyUrl,
        bucketPath,
      },
    })

    return NextResponse.json(cover, { status: 201 })
  } catch (err) {
    logger.error({ userId: user.id, path: request.nextUrl.pathname, error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined }, "Failed to create cover")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
