import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const covers = await prisma.cover.findMany({
      where: { userId: user.id },
      select: { bucketPath: true },
    })

    const bucketPaths = covers.map((c) => c.bucketPath).filter(Boolean)
    if (bucketPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("user_covers")
        .remove(bucketPaths)

      if (storageError) {
        logger.error({ userId: user.id }, "Failed to delete cover files from bucket during account deletion")
      }
    }

    await prisma.cover.deleteMany({ where: { userId: user.id } })

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      logger.error("SUPABASE_SERVICE_ROLE_KEY not configured for account deletion")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    if (!adminRes.ok) {
      logger.error({ userId: user.id, status: adminRes.status }, "Failed to delete Supabase user")
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    logger.info({ userId: user.id }, "Account deleted successfully")
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error({
      userId: user.id,
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    }, "Failed to delete account")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}