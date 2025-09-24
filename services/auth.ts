import axios from "axios"
import type { AuthResponse, UserDevice } from "@/types"

// CRITICAL FIX: Use the original API URL structure for direct API calls
const API_URL = "https://phubauth.hasansarker58.workers.dev"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only run on client side
      if (typeof window !== "undefined") {
        // Try to refresh token before logging out
        try {
          const refreshToken = localStorage.getItem("refresh_token")
          if (refreshToken) {
            const response = await refreshAccessToken(refreshToken)
            if (response.token) {
              localStorage.setItem("auth_token", response.token)
              error.config.headers.Authorization = `Bearer ${response.token}`
              return api(error.config)
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError)
        }

        // If refresh fails or no refresh token, clear auth data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        localStorage.removeItem("current_device_id")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// Decode JWT token to extract payload
export function decodeToken(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(window.atob(base64))
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log("[Auth Service] Attempting login with:", { email })

    // CRITICAL FIX: Use the original endpoint path
    const response = await api.post("/api/auth/login", {
      email,
      password,
      extended: true, // Request 30-day session
      // Add device fingerprint for better device identification
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      },
    })

    console.log("[Auth Service] Login response:", response.data)

    const { token, refresh_token, user, device_id } = response.data

    // Store tokens, user data, and device ID
    localStorage.setItem("auth_token", token)
    localStorage.setItem("refresh_token", refresh_token)
    localStorage.setItem("user", JSON.stringify(user))

    // Store the current device ID
    if (device_id) {
      localStorage.setItem("current_device_id", device_id)
    } else {
      // If device_id is not directly provided, try to extract it from token
      const tokenPayload = decodeToken(token)
      if (tokenPayload && tokenPayload.deviceId) {
        localStorage.setItem("current_device_id", tokenPayload.deviceId)
      }
    }

    return response.data
  } catch (error) {
    console.error("[Auth Service] Login error:", error)

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        // Handle rate limiting
        const attempts = localStorage.getItem(`login_attempts_${email}`) || '{"count": 0}'
        const { count } = JSON.parse(attempts)
        const newCount = count + 1

        if (newCount >= 5) {
          const lockedUntil = Date.now() + 30 * 60 * 1000 // 30 minutes
          localStorage.setItem(
            `login_attempts_${email}`,
            JSON.stringify({
              count: newCount,
              lockedUntil,
            }),
          )
          throw new Error("Too many failed attempts. Account locked for 30 minutes.")
        } else {
          localStorage.setItem(
            `login_attempts_${email}`,
            JSON.stringify({
              count: newCount,
            }),
          )
        }
      }

      if (!error.response) {
        throw new Error("Unable to connect to the server. Please check your internet connection.")
      }
      throw new Error(error.response.data.message || "Login failed")
    }
    throw error
  }
}

async function refreshAccessToken(refreshToken: string) {
  // CRITICAL FIX: Use the original endpoint path
  const response = await api.post("/api/auth/refresh-token", { refresh_token: refreshToken })
  return response.data
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    // CRITICAL FIX: Use the original endpoint path
    const response = await api.post("/api/auth/register", {
      name,
      email,
      password,
      // Add device fingerprint for better device identification
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Unable to connect to the server. Please check your internet connection.")
      }
      throw new Error(error.response.data.message || "Registration failed")
    }
    throw error
  }
}

export async function logout(deviceId?: string): Promise<void> {
  try {
    // Only run on client side
    if (typeof window === "undefined") return

    const token = localStorage.getItem("auth_token")
    const currentDeviceId = localStorage.getItem("current_device_id")

    if (token) {
      if (deviceId) {
        // CRITICAL FIX: Use the original endpoint path
        await api.post(`/api/auth/logout/${deviceId}`)

        // If we're logging out the current device, clear local storage and redirect
        if (deviceId === currentDeviceId) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("user")
          localStorage.removeItem("current_device_id")
          window.location.href = "/login"
        }
      } else {
        // CRITICAL FIX: Use the original endpoint path
        await api.post("/api/auth/logout")

        // Clear local storage and redirect
        localStorage.removeItem("auth_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        localStorage.removeItem("current_device_id")
        window.location.href = "/login"
      }
    }
  } catch (error) {
    console.error("Logout error:", error)
    // If there's an error during logout, still clear local storage
    if (!deviceId || deviceId === localStorage.getItem("current_device_id")) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("current_device_id")
      window.location.href = "/login"
    }
    throw error
  }
}

// Update the getUserDevices function to properly identify the current device
export async function getUserDevices(): Promise<UserDevice[]> {
  try {
    // Only run on client side
    if (typeof window === "undefined") return []

    const token = localStorage.getItem("auth_token")
    const currentDeviceId = localStorage.getItem("current_device_id")

    if (!token) return []

    // CRITICAL FIX: Use the original endpoint path
    const response = await api.get("/api/user/devices")

    // Mark the current device
    const devices = response.data.devices.map((device: any) => ({
      ...device,
      is_current: device.device_id === currentDeviceId,
    }))

    return devices
  } catch (error) {
    console.error("Error fetching user devices:", error)
    throw error
  }
}

// Update the logoutDevice function to use the device's database ID instead of device_id
export async function logoutDevice(deviceId: string): Promise<void> {
  try {
    // Only run on client side
    if (typeof window === "undefined") return

    const token = localStorage.getItem("auth_token")
    const currentDeviceId = localStorage.getItem("current_device_id")

    if (!token) return

    // Find the device in our list to get its database ID
    const devices = await getUserDevices()
    const device = devices.find((d) => d.device_id === deviceId)

    if (!device || !device.id) {
      throw new Error("Device not found or missing database ID")
    }

    // Use the database ID (id) for the API call, not the device_id
    // CRITICAL FIX: Use the original endpoint path
    const response = await api.post(`/api/user/devices/${device.id}/logout`)

    // If we're logging out the current device, clear auth data
    if (deviceId === currentDeviceId) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("current_device_id")
      window.location.href = "/login"
    }

    return response.data
  } catch (error) {
    console.error("Error logging out device:", error)
    throw error
  }
}

export async function logoutAllOtherDevices(): Promise<void> {
  // CRITICAL FIX: Use the original endpoint path
  await api.post("/api/user/devices/logout-all-other")
}

export async function checkAuth(): Promise<boolean> {
  try {
    // Only run on client side
    if (typeof window === "undefined") return false

    const token = localStorage.getItem("auth_token")
    const refreshToken = localStorage.getItem("refresh_token")

    if (!token || !refreshToken) return false

    // Verify token with server
    try {
      // CRITICAL FIX: Use the original endpoint path
      await api.get("/api/user/profile")
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Try to refresh token
        const response = await refreshAccessToken(refreshToken)
        if (response.token) {
          localStorage.setItem("auth_token", response.token)
          return true
        }
      }
      throw error
    }
  } catch (error) {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    localStorage.removeItem("current_device_id")
    return false
  }
}

export async function updateMembershipPlan(planType: string): Promise<void> {
  try {
    // CRITICAL FIX: Use the original endpoint path
    const response = await api.post("/api/user/membership", { plan: planType })
    const { user } = response.data

    // Update the user data in localStorage
    localStorage.setItem("user", JSON.stringify(user))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Unable to connect to the server. Please check your internet connection.")
      }
      throw new Error(error.response.data.message || "Failed to update membership plan")
    }
    throw error
  }
}

// New function to update user profile
export async function updateUserProfile(data: {
  name?: string
  email?: string
  current_password?: string
  new_password?: string
}) {
  try {
    // CRITICAL FIX: Use the original endpoint path
    const response = await api.put("/api/user/profile", data)

    if (response.data.success) {
      // Update the user data in localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Unable to connect to the server. Please check your internet connection.")
      }

      // Handle specific error cases
      if (error.response.status === 409) {
        throw new Error("Email already in use")
      } else if (error.response.status === 401 && error.response.data.error?.includes("password")) {
        throw new Error("Current password is incorrect")
      } else {
        throw new Error(error.response.data.error || error.response.data.message || "Failed to update profile")
      }
    }
    throw error
  }
}

// Generate a unique device fingerprint
export function generateDeviceFingerprint(): string {
  if (typeof window === "undefined") return ""

  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.hardwareConcurrency,
    window.screen.colorDepth,
    window.screen.width + "x" + window.screen.height,
  ]

  // Add user-specific component if available
  const user = localStorage.getItem("user")
  if (user) {
    try {
      const userData = JSON.parse(user)
      if (userData.id) {
        components.push(userData.id)
      }
    } catch (e) {
      console.error("Error parsing user data:", e)
    }
  }

  // Create a hash of the components
  let hash = 0
  const str = components.join("|||")
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return hash.toString(36) + Date.now().toString(36)
}

export default api
