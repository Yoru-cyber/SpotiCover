import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { GET } from "./route"
import { createClient } from "@/lib/supabase/server"

const mockCreateClient = vi.mocked(createClient)

function makeRequest(url: string) {
  return new Request(url, { method: "GET" })
}

function mockSupabaseAuth(exchangeResult: { error: unknown } = { error: null }) {
  const supabase = {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(exchangeResult),
    },
  }
  mockCreateClient.mockResolvedValue(supabase as never)
  return supabase
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to login when no code is provided", async () => {
    mockSupabaseAuth()

    const req = makeRequest("http://localhost/auth/callback")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/auth/login?error=auth_failed")
  })

  it("redirects to login when code exchange fails", async () => {
    mockSupabaseAuth({ error: new Error("Invalid code") })

    const req = makeRequest("http://localhost/auth/callback?code=bad_code")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toContain("/auth/login?error=auth_failed")
  })

  it("redirects to root when code exchange succeeds without next param", async () => {
    mockSupabaseAuth()

    const req = makeRequest("http://localhost/auth/callback?code=valid_code")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toBe("http://localhost/")
  })

  it("redirects to next path when code exchange succeeds", async () => {
    mockSupabaseAuth()

    const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=/gallery")
    const res = await GET(req)
    const location = res.headers.get("location")

    expect(res.status).toBe(307)
    expect(location).toBe("http://localhost/gallery")
  })

  describe("safeRedirectPath — open redirect prevention", () => {
    it("blocks protocol-relative URL //evil.com", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=//evil.com")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("blocks backslash-prefixed URL /\\\\evil.com", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=/\\\\evil.com")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("blocks absolute URL https://evil.com", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=https://evil.com")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("blocks javascript: URL", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=javascript:alert(1)")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("blocks empty string next param", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("blocks null next param", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/")
    })

    it("allows valid relative path /dashboard", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=/dashboard")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/dashboard")
    })

    it("allows nested path /stats?time_range=medium_term", async () => {
      mockSupabaseAuth()

      const req = makeRequest("http://localhost/auth/callback?code=valid_code&next=/stats?time_range=medium_term")
      const res = await GET(req)
      const location = res.headers.get("location")

      expect(location).toBe("http://localhost/stats?time_range=medium_term")
    })
  })
})
