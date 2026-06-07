import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  isDev ? "img-src 'self' data: http: https: blob:" : "img-src 'self' data: https: blob:",
  "font-src 'self'",
  isDev
    ? "connect-src 'self' http://127.0.0.1:54321 https://*.supabase.co https://api.spotify.com https://accounts.spotify.com https://scannables.scdn.co"
    : "connect-src 'self' https://*.supabase.co https://api.spotify.com https://accounts.spotify.com https://scannables.scdn.co",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig