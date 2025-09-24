import type { NextApiRequest, NextApiResponse } from "next"

// Define environment variables for API endpoints without fallbacks
const API_ENDPOINTS = {
  categories: process.env.CATEGORY_API_URL,
  creators: process.env.CREATOR_API_URL,
  creatorsList: process.env.API_BASE_URL,
  webseries: process.env.WEBSERIES_API_URL,
  search: process.env.SEARCH_API_URL,
  auth: process.env.AUTH_API_URL,
  embed: process.env.EMBED_API_URL,
  player: process.env.PLAYER_API_URL,
}

// Add validation for required environment variables
const validateEnvironmentVariables = () => {
  const missingVars = Object.entries(API_ENDPOINTS)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`)
    return false
  }
  return true
}

// Update the proxy handler to correctly handle the URL format for the creators list API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate environment variables
    if (!validateEnvironmentVariables()) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "API endpoints not properly configured. Please check server environment variables.",
      })
    }

    // Get the path and service from the request
    const { path } = req.query

    if (!path || !Array.isArray(path) || path.length < 1) {
      return res.status(400).json({ error: "Invalid path" })
    }

    // The first part of the path is the service name
    const service = path[0]
    // The rest of the path is the actual endpoint
    const endpoint = path.slice(1).join("/")

    // Get the base URL for the service
    const baseUrl = getServiceUrl(service)
    if (!baseUrl) {
      return res.status(400).json({ error: "Invalid service" })
    }

    // Special handling for creatorsList service which has a different URL structure
    let url
    if (service === "creatorsList") {
      // For creatorsList, the endpoint is a full URL that needs to be appended to the base URL
      // First, decode the endpoint if it's URL encoded
      const decodedEndpoint = decodeURIComponent(endpoint)
      url = `${baseUrl}/${decodedEndpoint}`
    } else {
      // For other services, construct the URL normally
      url = `${baseUrl}/${endpoint}`
    }

    console.log(`[API Proxy] Forwarding request to: ${url}`)

    try {
      // Forward the request to the appropriate service
      const response = await fetch(url, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          // Forward authorization header if present
          ...(req.headers.authorization ? { Authorization: req.headers.authorization as string } : {}),
        },
        // Include body for non-GET requests
        ...(req.method !== "GET" && req.body ? { body: JSON.stringify(req.body) } : {}),
      })

      // Get the response data
      const contentType = response.headers.get("content-type")
      let data

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Return the response with the same status code
      if (contentType?.includes("application/json")) {
        res.status(response.status).json(data)
      } else {
        res.status(response.status).send(data)
      }
    } catch (fetchError) {
      console.error(`[API Proxy] Fetch error for ${url}:`, fetchError)
      res.status(502).json({ error: "Bad Gateway", message: "Failed to fetch from upstream server" })
    }
  } catch (error) {
    console.error("[API Proxy] Server error:", error)
    res.status(500).json({ error: "Internal server error", message: (error as Error).message })
  }
}

// Helper function to get the service URL
function getServiceUrl(service: string): string | null {
  const url = API_ENDPOINTS[service as keyof typeof API_ENDPOINTS]
  return url || null
}
