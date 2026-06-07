import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const cover = await prisma.cover.findUnique({ where: { id } })

  if (!cover) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (cover.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error: storageError } = await supabase.storage
    .from("user_covers")
    .remove([cover.bucketPath])

  if (storageError) {
    console.error("Failed to delete file from bucket:", storageError)
  }

  await prisma.cover.delete({ where: { id } })

  return NextResponse.json({ success: true })
}