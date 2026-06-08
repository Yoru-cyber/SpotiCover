import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = await prisma.spotifyToken.findUnique({
    where: { userId: user.id },
    select: { userId: true },
  })

  return NextResponse.json({ connected: !!token })
}

export async function DELETE(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.spotifyToken.delete({ where: { userId: user.id } })
    logger.info({ userId: user.id }, "Spotify disconnected")
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({
      userId: user.id,
      error: err instanceof Error ? err.message : "Unknown error",
    }, "Failed to disconnect Spotify")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}