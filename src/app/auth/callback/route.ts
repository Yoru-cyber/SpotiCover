import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/"
  }
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeRedirectPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const url = new URL(next, origin)
      return NextResponse.redirect(url.toString())
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
