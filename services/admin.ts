import type { AuthUser, UserDevice } from "@/types"

// Direct API URL
const API_URL = "https://phubauth.hasansarker58.workers.dev"

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

// Get all users
export async function getAllUsers(): Promise<AuthUser[]> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log("[Admin] Fetching all users")
    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error fetching users: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[Admin] Users fetched successfully:", data)
    return data.users || []
  } catch (error) {
    console.error("[Admin] Error in getAllUsers:", error)
    throw error
  }
}

// Get user by ID
export async function getUserById(userId: number): Promise<AuthUser | null> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Fetching user ${userId}`)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // If endpoint doesn't exist (404), fall back to fetching all users
    if (!response.ok && response.status === 404) {
      console.log(`[Admin] User endpoint not found (404), falling back to getAllUsers`)
      try {
        const allUsers = await getAllUsers()
        // Try matching by string ID or numeric ID
        const user = allUsers.find((u) => {
          const userStrId = String(u.id)
          const userIdStr = String(userId)
          return userStrId === userIdStr || parseInt(userStrId) === userId
        })
        if (user) {
          console.log(`[Admin] User found via getAllUsers fallback:`, user)
          return user
        } else {
          console.log(`[Admin] User ${userId} not found in users list`)
          return null
        }
      } catch (fallbackError) {
        console.error(`[Admin] Error in fallback getAllUsers:`, fallbackError)
        throw new Error(`Failed to fetch user: User not found and fallback failed`)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error fetching user: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] User fetched successfully:`, data)
    return data.user || null
  } catch (error) {
    console.error(`[Admin] Error in getUserById:`, error)
    throw error
  }
}

// Get user devices - Now using the fixed admin endpoint
export async function getUserDevices(userId: number): Promise<UserDevice[]> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Fetching devices for user ${userId}`)

    // Use the fixed admin endpoint directly
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/devices`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // If endpoint doesn't exist (404), return empty array
    if (!response.ok && response.status === 404) {
      console.log(`[Admin] Devices endpoint not found (404), returning empty array`)
      return []
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error fetching devices: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] Devices fetched successfully:`, data)

    return data.devices || []
  } catch (error) {
    console.error(`[Admin] Error in getUserDevices:`, error)
    throw error
  }
}

// Logout specific device for a user
export async function logoutUserDevice(userId: number, deviceId: number): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Logging out device ${deviceId} for user ${userId}`)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/devices/${deviceId}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error logging out device: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to logout device: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] Device logged out successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in logoutUserDevice:`, error)
    throw error
  }
}

// Logout all devices for a user
export async function logoutAllDevices(userId: number): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Logging out all devices for user ${userId}`)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/devices/logout-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error logging out all devices: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to logout all devices: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] All devices logged out successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in logoutAllDevices:`, error)
    throw error
  }
}

// Update user
export async function updateUser(userId: number, userData: Partial<AuthUser>): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    // Only auto-calculate expiry date if:
    // 1. membership_status is being changed
    // 2. membership_expires_at is NOT explicitly provided (to allow manual editing)
    if (userData.membership_status !== undefined && !('membership_expires_at' in userData)) {
      if (userData.membership_status === "free" || userData.membership_status === "admin") {
        userData.membership_expires_at = null
      } else {
        userData.membership_expires_at = calculatePlanExpiry(userData.membership_status)
      }
    }

    // If only password-related fields are being updated (without membership fields),
    // ensure membership fields are not accidentally modified
    const hasPasswordField = 'password' in userData || 'new_password' in userData || 'current_password' in userData
    const hasMembershipField = 'membership_status' in userData || 'membership_expires_at' in userData
    
    // If updating password but not membership, don't include membership fields
    if (hasPasswordField && !hasMembershipField) {
      // Explicitly exclude membership fields to prevent backend from auto-updating them
      delete userData.membership_status
      delete userData.membership_expires_at
    }

    console.log(`[Admin] Updating user ${userId}:`, userData)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error updating user: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to update user: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] User updated successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in updateUser:`, error)
    throw error
  }
}

// Cancel membership
export async function cancelMembership(userId: number): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Cancelling membership for user ${userId}`)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/cancel-membership`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error cancelling membership: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to cancel membership: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] Membership cancelled successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in cancelMembership:`, error)
    throw error
  }
}

// Delete user
export async function deleteUser(userId: number): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    console.log(`[Admin] Deleting user ${userId}`)
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error deleting user: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] User deleted successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in deleteUser:`, error)
    throw error
  }
}

// Add user
export async function addUser(userData: {
  name: string
  email: string
  password: string
  membership_status: string
}): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("No authentication token found")
    }

    // Calculate expiry date for membership
    let membership_expires_at = null
    if (userData.membership_status !== "free" && userData.membership_status !== "admin") {
      membership_expires_at = calculatePlanExpiry(userData.membership_status)
    }

    console.log(`[Admin] Adding new user:`, { ...userData, password: "********" })
    const response = await fetch(`${API_URL}/api/admin/users/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...userData,
        membership_expires_at,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Admin] Error adding user: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to add user: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[Admin] User added successfully:`, data)
  } catch (error) {
    console.error(`[Admin] Error in addUser:`, error)
    throw error
  }
}

// Calculate plan expiry date
export function calculatePlanExpiry(planType: string): string {
  const now = new Date()
  const expiryDate = new Date(now)

  switch (planType) {
    case "monthly":
      expiryDate.setDate(now.getDate() + 30) // 30 days
      break
    case "3month":
      expiryDate.setDate(now.getDate() + 90) // 90 days
      break
    case "halfyearly":
      expiryDate.setDate(now.getDate() + 182) // 182 days
      break
    case "yearly":
      expiryDate.setDate(now.getDate() + 365) // 365 days
      break
    default:
      return ""
  }

  return expiryDate.toISOString()
}

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  cancelMembership,
  getUserDevices,
  logoutUserDevice,
  logoutAllDevices,
  addUser,
}
