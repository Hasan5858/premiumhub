import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rate limiting configuration for auth endpoints
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Maximum requests per window
  WINDOW_MS: 60 * 1000, // 1 minute window
}

// Simple in-memory store for rate limiting
// Note: This will reset on server restart. For production, use Redis or similar.
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {}

// Middleware function
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Only apply rate limiting to auth endpoints
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    // Get client IP for rate limiting
    const ip = request.ip || "unknown"
    const key = `${ip}:${request.nextUrl.pathname}`

    // Check if this IP is already being rate limited
    const now = Date.now()
    const rateLimit = rateLimitStore[key]

    if (rateLimit) {
      // Reset count if window has passed
      if (now > rateLimit.resetAt) {
        rateLimitStore[key] = {
          count: 1,
          resetAt: now + RATE_LIMIT.WINDOW_MS,
        }
      } else {
        // Increment count
        rateLimit.count++

        // Check if rate limit exceeded
        if (rateLimit.count > RATE_LIMIT.MAX_REQUESTS) {
          return new NextResponse(
            JSON.stringify({
              error: "Too many requests",
              message: "Please try again later",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": `${Math.ceil((rateLimit.resetAt - now) / 1000)}`,
              },
            },
          )
        }
      }
    } else {
      // First request from this IP to this endpoint
      rateLimitStore[key] = {
        count: 1,
        resetAt: now + RATE_LIMIT.WINDOW_MS,
      }
    }

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
  }

  return response
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: "/api/:path*",
}
