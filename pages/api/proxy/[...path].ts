import type { NextApiRequest, NextApiResponse } from "next"

// Define environment variables for API endpoints without fallbacks
const API_ENDPOINTS = {
  categories: process.env.CATEGORY_API_URL,
  webseries: process.env.WEBSERIES_API_URL,
  search: process.env.SEARCH_API_URL,
  auth: process.env.AUTH_API_URL,
  embed: process.env.EMBED_API_URL,
  player: process.env.PLAYER_API_URL,
}

// Validate environment variable for a specific service
const validateServiceEnvironmentVariable = (service: string): boolean => {
  // Check if service exists in our API endpoints
  if (!(service in API_ENDPOINTS)) {
    // Service doesn't exist in our list - might be invalid service
    return false
  }
  
  const serviceUrl = API_ENDPOINTS[service as keyof typeof API_ENDPOINTS]
  
  // Check if the environment variable is set
  if (!serviceUrl) {
    console.error(`Missing required environment variable for service "${service}": ${service.toUpperCase()}_API_URL`)
    return false
  }
  
  return true
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the path and service from the request
    const { path } = req.query

    if (!path || !Array.isArray(path) || path.length < 1) {
      return res.status(400).json({ error: "Invalid path" })
    }

    // The first part of the path is the service name
    const service = path[0]
    // The rest of the path is the actual endpoint
    const endpoint = path.slice(1).join("/")

    // Validate environment variable only for the service being requested
    if (!validateServiceEnvironmentVariable(service)) {
      return res.status(500).json({
        error: "Server configuration error",
        message: `API endpoint for service "${service}" not properly configured. Please check ${service.toUpperCase()}_API_URL environment variable.`,
      })
    }

    // Get the base URL for the service
    const baseUrl = getServiceUrl(service)
    if (!baseUrl) {
      return res.status(400).json({ error: "Invalid service" })
    }

    // Construct the URL for the service
    const url = `${baseUrl}/${endpoint}`

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
