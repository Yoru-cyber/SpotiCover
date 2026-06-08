import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForToken } from "@/lib/spotify"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    if (error || !code) {
      logger.error({ error }, "Spotify OAuth callback error")
      return NextResponse.redirect(new URL("/stats?error=spotify_denied", request.url))
    }

    if (state) {
      void state
    }

    const codeVerifier = request.cookies.get("spotify_code_verifier")?.value
    if (!codeVerifier) {
      logger.error("Missing code verifier cookie")
      return NextResponse.redirect(new URL("/stats?error=no_verifier", request.url))
    }

    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(code, codeVerifier)

    await prisma.spotifyToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, accessToken, refreshToken, expiresAt },
      update: { accessToken, refreshToken, expiresAt },
    })

    const redirectResponse = NextResponse.redirect(new URL("/stats", request.url))
    redirectResponse.cookies.set("spotify_code_verifier", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return redirectResponse
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown error" }, "Spotify OAuth callback failed")
    return NextResponse.redirect(new URL("/stats?error=callback", request.url))
  }
}
