import { NextResponse } from "next/server"
import { generateCodeVerifier, generateCodeChallenge, getSpotifyAuthUrl } from "@/lib/spotify"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const authUrl = getSpotifyAuthUrl(challenge)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set("spotify_code_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    })

    return response
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown error" }, "Failed to start Spotify OAuth")
    return NextResponse.redirect(new URL("/stats?error=oauth", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:3000"))
  }
}
