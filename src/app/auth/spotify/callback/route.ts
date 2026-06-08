import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForToken } from "@/lib/spotify"
import { logger } from "@/lib/logger"

const ORIGIN =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000"
    : "https://spoti-cover-pearl.vercel.app";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(`${ORIGIN}/auth/login`)
    }

    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    if (error || !code) {
      logger.error({ error }, "Spotify OAuth callback error")
      return NextResponse.redirect(`${ORIGIN}/stats?error=spotify_denied`)
    }

    if (state) {
      void state
    }

    const codeVerifier = request.cookies.get("spotify_code_verifier")?.value
    if (!codeVerifier) {
      logger.error("Missing code verifier cookie")
      return NextResponse.redirect(`${ORIGIN}/stats?error=no_verifier`)
    }

    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(code, codeVerifier)

    await prisma.spotifyToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, accessToken, refreshToken, expiresAt },
      update: { accessToken, refreshToken, expiresAt },
    })

    const redirectResponse = NextResponse.redirect(`${ORIGIN}/stats`)
    redirectResponse.cookies.set("spotify_code_verifier", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return redirectResponse
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    logger.error({ error: message, stack: err instanceof Error ? err.stack : undefined }, "Spotify OAuth callback failed")
    return NextResponse.redirect(`${ORIGIN}/stats?error=callback&details=${encodeURIComponent(message)}`)
  }
}
