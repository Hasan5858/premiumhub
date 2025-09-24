import type { NextApiRequest, NextApiResponse } from "next"

// Validate that the AUTH_API_URL environment variable is set
if (!process.env.AUTH_API_URL) {
  console.error("AUTH_API_URL environment variable is not set")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate the environment variable
    if (!process.env.AUTH_API_URL) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Authentication service not properly configured.",
      })
    }

    // Get the auth route from the request
    const { authRoute } = req.query

    if (!authRoute || !Array.isArray(authRoute) || authRoute.length < 1) {
      return res.status(400).json({ error: "Invalid auth route" })
    }

    // Construct the endpoint path
    const endpoint = authRoute.join("/")

    // CRITICAL FIX: Determine the correct API path based on the endpoint
    let apiPath = endpoint

    // Check if this is an auth endpoint or a user endpoint
    if (endpoint.startsWith("api/")) {
      // Already has api/ prefix, use as is
      apiPath = endpoint
    } else if (endpoint.startsWith("user/")) {
      // User endpoint, add api/ prefix
      apiPath = `api/${endpoint}`
    } else {
      // Auth endpoint, add api/auth/ prefix
      apiPath = `api/auth/${endpoint}`
    }

    // Construct the full URL to the auth API
    const url = `${process.env.AUTH_API_URL}/${apiPath}`

    console.log(`[Auth Proxy] Forwarding request to: ${url}`)
    console.log(`[Auth Proxy] Request method: ${req.method}`)
    console.log(`[Auth Proxy] Request body:`, req.body)

    // Forward the request to the auth API
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Forward authorization header if present
      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization as string
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
        // Include body for non-GET requests
        ...(req.method !== "GET" && req.body ? { body: JSON.stringify(req.body) } : {}),
      }

      console.log(`[Auth Proxy] Fetch options:`, {
        method: fetchOptions.method,
        headers: fetchOptions.headers,
        bodyIncluded: !!fetchOptions.body,
      })

      const response = await fetch(url, fetchOptions)

      // Get the response data
      const contentType = response.headers.get("content-type")
      let data

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      console.log(`[Auth Proxy] Response status: ${response.status}`)
      console.log(`[Auth Proxy] Response data:`, data)

      // Return the response with the same status code
      if (contentType?.includes("application/json")) {
        return res.status(response.status).json(data)
      } else {
        return res.status(response.status).send(data)
      }
    } catch (fetchError) {
      console.error(`[Auth Proxy] Fetch error for ${url}:`, fetchError)
      return res.status(502).json({
        error: "Authentication service unavailable",
        message: "Failed to connect to authentication service",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
    }
  } catch (error) {
    console.error("[Auth Proxy] Server error:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
