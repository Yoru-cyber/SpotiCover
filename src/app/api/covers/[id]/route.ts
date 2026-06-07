import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = rateLimit({
    windowMs: 60_000,
    max: 20,
    identifier: `covers-delete:${user.id}`,
  })

  if (rl.limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { id } = await params

  if (!id || typeof id !== "string" || id.length > 50) {
    return NextResponse.json({ error: "Invalid cover ID" }, { status: 400 })
  }

  try {
    const cover = await prisma.cover.findUnique({ where: { id } })

    if (!cover) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (cover.userId !== user.id) {
      logger.warn({ userId: user.id, coverOwnerId: cover.userId, coverId: id, path: request.nextUrl.pathname }, "Forbidden cover delete attempt")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error: storageError } = await supabase.storage
      .from("user_covers")
      .remove([cover.bucketPath])

    if (storageError) {
      logger.error({ userId: user.id, coverId: id, bucketPath: cover.bucketPath }, "Failed to delete cover file from bucket")
    }

    await prisma.cover.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({ userId: user.id, coverId: id, path: request.nextUrl.pathname, error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined }, "Failed to delete cover")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
