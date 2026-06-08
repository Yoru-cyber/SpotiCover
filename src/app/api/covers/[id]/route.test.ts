import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cover: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ limited: false, remaining: 20, resetAt: Date.now() + 60_000 })),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { DELETE } from "./route"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const mockCreateClient = vi.mocked(createClient)
const mockPrisma = vi.mocked(prisma)
const mockRateLimit = vi.mocked(rateLimit)
const mockLogger = vi.mocked(logger)

function makeRequest(pathname: string) {
  return new NextRequest(new URL(`http://localhost${pathname}`), {
    method: "DELETE",
  })
}

function mockSupabaseUser(user: { id: string } | null, error: unknown = null) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }
  mockCreateClient.mockResolvedValue(supabase as never)
  return supabase
}

describe("DELETE /api/covers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue({ limited: false, remaining: 20, resetAt: Date.now() + 60_000 })
  })

  it("returns 401 when user is not authenticated", async () => {
    mockSupabaseUser(null, new Error("Not authenticated"))

    const req = makeRequest("/api/covers/abc123")
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc123" }) })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 401 when user object is null", async () => {
    mockSupabaseUser(null)

    const req = makeRequest("/api/covers/abc123")
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc123" }) })

    expect(res.status).toBe(401)
  })

  it("returns 429 when rate limited", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockRateLimit.mockReturnValue({ limited: true, remaining: 0, resetAt: Date.now() + 60_000 })

    const req = makeRequest("/api/covers/abc123")
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc123" }) })
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toBe("Too many requests")
  })

  it("returns 400 when id is empty", async () => {
    mockSupabaseUser({ id: "user-1" })

    const req = makeRequest("/api/covers/")
    const res = await DELETE(req, { params: Promise.resolve({ id: "" }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe("Invalid cover ID")
  })

  it("returns 400 when id exceeds 50 characters", async () => {
    mockSupabaseUser({ id: "user-1" })
    const longId = "a".repeat(51)

    const req = makeRequest(`/api/covers/${longId}`)
    const res = await DELETE(req, { params: Promise.resolve({ id: longId }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe("Invalid cover ID")
  })

  it("returns 404 when cover does not exist", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockPrisma.cover.findUnique.mockResolvedValue(null)

    const req = makeRequest("/api/covers/nonexistent")
    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe("Not found")
  })

  it("returns 403 when cover belongs to another user", async () => {
    mockSupabaseUser({ id: "user-1" })
    mockPrisma.cover.findUnique.mockResolvedValue({
      id: "cover-1",
      userId: "other-user",
      bucketPath: "path/to/file.png",
    } as never)

    const req = makeRequest("/api/covers/cover-1")
    const res = await DELETE(req, { params: Promise.resolve({ id: "cover-1" }) })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe("Forbidden")
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", coverOwnerId: "other-user" }),
      "Forbidden cover delete attempt",
    )
  })

  it("deletes cover successfully when user is owner", async () => {
    const supabase = mockSupabaseUser({ id: "user-1" })
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    supabase.storage.from.mockReturnValue({ remove: removeMock })

    mockPrisma.cover.findUnique.mockResolvedValue({
      id: "cover-1",
      userId: "user-1",
      bucketPath: "user-1/cover-1.png",
    } as never)
    mockPrisma.cover.delete.mockResolvedValue({} as never)

    const req = makeRequest("/api/covers/cover-1")
    const res = await DELETE(req, { params: Promise.resolve({ id: "cover-1" }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(supabase.storage.from).toHaveBeenCalledWith("user_covers")
    expect(removeMock).toHaveBeenCalledWith(["user-1/cover-1.png"])
    expect(mockPrisma.cover.delete).toHaveBeenCalledWith({ where: { id: "cover-1" } })
  })

  it("still deletes from DB when bucket deletion fails", async () => {
    const supabase = mockSupabaseUser({ id: "user-1" })
    const removeMock = vi.fn().mockResolvedValue({ error: new Error("Storage error") })
    supabase.storage.from.mockReturnValue({ remove: removeMock })

    mockPrisma.cover.findUnique.mockResolvedValue({
      id: "cover-1",
      userId: "user-1",
      bucketPath: "user-1/cover-1.png",
    } as never)
    mockPrisma.cover.delete.mockResolvedValue({} as never)

    const req = makeRequest("/api/covers/cover-1")
    const res = await DELETE(req, { params: Promise.resolve({ id: "cover-1" }) })

    expect(res.status).toBe(200)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Object),
      "Failed to delete cover file from bucket",
    )
    expect(mockPrisma.cover.delete).toHaveBeenCalled()
  })

  it("returns 500 when prisma.delete throws after successful bucket deletion", async () => {
    const supabase = mockSupabaseUser({ id: "user-1" })
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    supabase.storage.from.mockReturnValue({ remove: removeMock })

    mockPrisma.cover.findUnique.mockResolvedValue({
      id: "cover-1",
      userId: "user-1",
      bucketPath: "user-1/cover-1.png",
    } as never)
    mockPrisma.cover.delete.mockRejectedValue(new Error("DB connection lost"))

    const req = makeRequest("/api/covers/cover-1")
    const res = await DELETE(req, { params: Promise.resolve({ id: "cover-1" }) })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe("Internal server error")
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ coverId: "cover-1" }),
      "Failed to delete cover",
    )
  })

  it("calls rateLimit with correct identifier", async () => {
    mockSupabaseUser({ id: "user-42" })
    mockPrisma.cover.findUnique.mockResolvedValue(null)

    const req = makeRequest("/api/covers/abc")
    await DELETE(req, { params: Promise.resolve({ id: "abc" }) })

    expect(mockRateLimit).toHaveBeenCalledWith({
      windowMs: 60_000,
      max: 20,
      identifier: "covers-delete:user-42",
    })
  })
})
