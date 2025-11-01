"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, Laptop, Smartphone, LogOut, AlertCircle, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getUserDevices, logoutUserDevice, logoutAllDevices, getUserById } from "@/services/admin"
import type { UserDevice, AuthUser } from "@/types"

export default function UserDevicesPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [user, setUser] = useState<AuthUser | null>(null)
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingDevice, setRemovingDevice] = useState<number | null>(null)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }

    // Wait for router to be ready and have id
    if (router.isReady && id) {
      loadData()
    }
  }, [currentUser, isAdmin, router.isReady, id, router])

  const loadData = async () => {
    if (!id || typeof id !== "string") return

    try {
      setLoading(true)
      setError(null)

      const userId = parseInt(id)
      if (isNaN(userId)) {
        setError("Invalid user ID")
        return
      }

      // Load user info and devices in parallel
      const [userData, deviceList] = await Promise.all([
        getUserById(userId),
        getUserDevices(userId),
      ])

      if (!userData) {
        setError("User not found")
        toast.error("User not found")
        return
      }

      setUser(userData)
      setDevices(deviceList)
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data. Please try again.")
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutDevice = async (deviceId: number) => {
    if (!id || typeof id !== "string") return

    try {
      setRemovingDevice(deviceId)
      const userId = parseInt(id)
      await logoutUserDevice(userId, deviceId)

      // Remove device from list
      setDevices(devices.filter((d) => d.id !== deviceId))
      toast.success("Device logged out successfully")
    } catch (err) {
      console.error("Failed to logout device:", err)
      toast.error(err instanceof Error ? err.message : "Failed to logout device. Please try again.")
    } finally {
      setRemovingDevice(null)
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!id || typeof id !== "string") return

    if (!confirm("Are you sure you want to logout all devices for this user?")) {
      return
    }

    try {
      setLoggingOutAll(true)
      const userId = parseInt(id)
      await logoutAllDevices(userId)

      // Clear devices list
      setDevices([])
      toast.success("All devices logged out successfully")
    } catch (err) {
      console.error("Failed to logout all devices:", err)
      toast.error(err instanceof Error ? err.message : "Failed to logout all devices. Please try again.")
    } finally {
      setLoggingOutAll(false)
    }
  }

  // Helper function to format device name
  const formatDeviceName = (device: UserDevice) => {
    const deviceInfo = device.device_info || ""

    // Extract device type
    let deviceType = "Unknown Device"

    if (deviceInfo.toLowerCase().includes("iphone") || deviceInfo.toLowerCase().includes("ipad")) {
      deviceType = "iOS Device"
    } else if (deviceInfo.toLowerCase().includes("android")) {
      deviceType = "Android Device"
    } else if (deviceInfo.toLowerCase().includes("windows")) {
      deviceType = "Windows PC"
    } else if (deviceInfo.toLowerCase().includes("macintosh") || deviceInfo.toLowerCase().includes("mac os")) {
      deviceType = "Mac"
    } else if (deviceInfo.toLowerCase().includes("linux")) {
      deviceType = "Linux"
    }

    // Extract browser info
    let browserInfo = ""
    if (deviceInfo.toLowerCase().includes("chrome")) {
      browserInfo = "Chrome"
    } else if (deviceInfo.toLowerCase().includes("firefox")) {
      browserInfo = "Firefox"
    } else if (deviceInfo.toLowerCase().includes("safari") && !deviceInfo.toLowerCase().includes("chrome")) {
      browserInfo = "Safari"
    } else if (deviceInfo.toLowerCase().includes("edge")) {
      browserInfo = "Edge"
    } else if (deviceInfo.toLowerCase().includes("opera")) {
      browserInfo = "Opera"
    }

    return browserInfo ? `${deviceType} - ${browserInfo}` : deviceType
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>User Devices - Admin Dashboard</title>
        </Head>
        <div className="pt-20 pb-10">
          <div className="container mx-auto px-4">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>User Not Found - Admin Dashboard</title>
        </Head>
        <div className="pt-20 pb-10">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
              <Link href="/admin" className="text-purple-400 hover:text-purple-300">
                ← Back to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{user.name} - Devices - Admin Dashboard</title>
        <meta name="description" content={`Manage devices for ${user.name}`} />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">User Devices</h1>
                <div className="flex items-center mt-1 space-x-2 text-gray-400">
                  <User size={16} />
                  <span>{user.name} ({user.email})</span>
                </div>
              </div>
            </div>
            {devices.length > 0 && (
              <button
                onClick={handleLogoutAllDevices}
                disabled={loggingOutAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOutAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={18} className="mr-2" />
                    Logout All Devices
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6 flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}

          {/* Devices List */}
          {devices.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <Laptop size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No devices found</h3>
              <p className="text-gray-500">This user has no active devices.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {device.device_info?.toLowerCase().includes("mobile") ||
                      device.device_info?.toLowerCase().includes("android") ||
                      device.device_info?.toLowerCase().includes("iphone") ? (
                        <Smartphone className="w-8 h-8 text-purple-400" />
                      ) : (
                        <Laptop className="w-8 h-8 text-purple-400" />
                      )}
                      <div>
                        <p className="font-medium text-white text-lg">{formatDeviceName(device)}</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-400">
                            IP Address: <span className="text-gray-300">{device.ip_address}</span>
                          </p>
                          <p className="text-sm text-gray-400">
                            Last Active: <span className="text-gray-300">{formatDate(device.last_login_at)}</span>
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{device.device_id}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLogoutDevice(device.id)}
                      disabled={removingDevice === device.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingDevice === device.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut size={18} className="mr-2" />
                          Logout Device
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-8 bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Active Devices</p>
                <p className="text-2xl font-bold text-white">{devices.length}</p>
              </div>
              <Link
                href={`/admin/users/${id}`}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Back to User Edit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

