import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const covers = await prisma.cover.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(covers)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { trackName, artistName, albumImageUrl, spotifyUrl, bucketPath } = body

  if (!trackName || !artistName || !albumImageUrl || !spotifyUrl || !bucketPath) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

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
}