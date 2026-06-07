import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      logger.error("TURNSTILE_SECRET_KEY not configured")
      return NextResponse.json({ success: false }, { status: 500 })
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    })

    const data = await res.json()

    return NextResponse.json({ success: data.success })
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown error" }, "Turnstile verification failed")
    return NextResponse.json({ success: false }, { status: 500 })
  }
}