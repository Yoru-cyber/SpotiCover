import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    spotifyToken: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/lib/spotify", () => ({
  exchangeCodeForToken: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { GET } from "./route"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { exchangeCodeForToken } from "@/lib/spotify"
import { logger } from "@/lib/logger"

const mockCreateClient = vi.mocked(createClient)
const mockPrisma = vi.mocked(prisma)
const mockExchangeCode = vi.mocked(exchangeCodeForToken)
const mockLogger = vi.mocked(logger)

const originalNodeEnv = process.env.NODE_ENV

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url), { method: "GET" })
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value)
  }
  return req
}

function mockSupabaseUser(user: { id: string } | null) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : new Error("Not authenticated"),
      }),
    },
  }
  mockCreateClient.mockResolvedValue(supabase as never)
  return supabase
}

describe("GET /auth/spotify/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = "development"
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it("redirects to login when user is not authenticated", async () => {
    mockSupabaseUser(null)

    const req = makeRequest("http://localhost/auth/spotify/callback?code=abc123")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/auth/login")
  })

  it("redirects with error when Spotify returns an error param", async () => {
    mockSupabaseUser({ id: "user-1" })

    const req = makeRequest("http://localhost/auth/spotify/callback?error=access_denied")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats?error=spotify_denied")
  })

  it("redirects with error when code is missing", async () => {
    mockSupabaseUser({ id: "user-1" })

    const req = makeRequest("http://localhost/auth/spotify/callback")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats?error=spotify_denied")
  })

  it("redirects with error when code_verifier cookie is missing", async () => {
    mockSupabaseUser({ id: "user-1" })

    const req = makeRequest("http://localhost/auth/spotify/callback?code=abc123")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats?error=no_verifier")
    expect(mockLogger.error).toHaveBeenCalledWith("Missing code verifier cookie")
  })

  it("exchanges code for token and upserts to database on success", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockResolvedValue({
      accessToken: "access_123",
      refreshToken: "refresh_123",
      expiresAt: new Date("2025-01-01T00:00:00Z"),
    })
    mockPrisma.spotifyToken.upsert.mockResolvedValue({} as never)

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=valid_code",
      { spotify_code_verifier: "my_verifier_value" },
    )
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats")
    expect(location).not.toContain("error")

    expect(mockExchangeCode).toHaveBeenCalledWith("valid_code", "my_verifier_value")
    expect(mockPrisma.spotifyToken.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: {
        userId: "user-1",
        accessToken: "access_123",
        refreshToken: "refresh_123",
        expiresAt: new Date("2025-01-01T00:00:00Z"),
      },
      update: {
        accessToken: "access_123",
        refreshToken: "refresh_123",
        expiresAt: new Date("2025-01-01T00:00:00Z"),
      },
    })
  })

  it("clears code_verifier cookie after successful exchange", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockResolvedValue({
      accessToken: "access_123",
      refreshToken: "refresh_123",
      expiresAt: new Date(),
    })
    mockPrisma.spotifyToken.upsert.mockResolvedValue({} as never)

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=valid_code",
      { spotify_code_verifier: "my_verifier" },
    )
    const res = await GET(req)

    const setCookieHeaders = res.headers.getSetCookie()
    const verifierCookie = setCookieHeaders.find((c) =>
      c.startsWith("spotify_code_verifier="),
    )

    expect(verifierCookie).toBeDefined()
    expect(verifierCookie).toContain("Max-Age=0")
    expect(verifierCookie).toContain("HttpOnly")
  })

  it("sets secure flag on cookie in production", async () => {
    process.env.NODE_ENV = "production"
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockResolvedValue({
      accessToken: "access_123",
      refreshToken: "refresh_123",
      expiresAt: new Date(),
    })
    mockPrisma.spotifyToken.upsert.mockResolvedValue({} as never)

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=valid_code",
      { spotify_code_verifier: "my_verifier" },
    )
    const res = await GET(req)

    const setCookieHeaders = res.headers.getSetCookie()
    const verifierCookie = setCookieHeaders.find((c) =>
      c.startsWith("spotify_code_verifier="),
    )

    expect(verifierCookie).toBeDefined()
    expect(verifierCookie).toContain("Secure")
  })

  it("redirects with error details when exchangeCodeForToken fails", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockRejectedValue(new Error("Token exchange failed: 400 invalid_grant"))

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=bad_code",
      { spotify_code_verifier: "bad_verifier" },
    )
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats?error=callback")
    expect(location).toContain("details=Token%20exchange%20failed")
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Token exchange failed: 400 invalid_grant" }),
      "Spotify OAuth callback failed",
    )
  })

  it("exposes error details in redirect URL — security concern", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockRejectedValue(
      new Error("Token exchange failed: 400 {\"error\":\"invalid_grant\",\"error_description\":\"Invalid authorization code\"}"),
    )

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=expired_code",
      { spotify_code_verifier: "verifier" },
    )
    const res = await GET(req)
    const location = res.headers.get("location")!

    const url = new URL(location)
    const details = url.searchParams.get("details")

    expect(details).toContain("invalid_grant")
    expect(details).toContain("Invalid authorization code")
  })

  it("state param is received but not validated — CSRF concern", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockResolvedValue({
      accessToken: "access_123",
      refreshToken: "refresh_123",
      expiresAt: new Date(),
    })
    mockPrisma.spotifyToken.upsert.mockResolvedValue({} as never)

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=valid_code&state=attacker_state_value",
      { spotify_code_verifier: "verifier" },
    )
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(mockExchangeCode).toHaveBeenCalled()
    expect(mockPrisma.spotifyToken.upsert).toHaveBeenCalled()
  })

  it("handles non-Error thrown values gracefully", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockExchangeCode.mockRejectedValue("string error")

    const req = makeRequest(
      "http://localhost/auth/spotify/callback?code=bad_code",
      { spotify_code_verifier: "verifier" },
    )
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/stats?error=callback")
    expect(location).toContain("details=Unknown%20error")
  })
})
