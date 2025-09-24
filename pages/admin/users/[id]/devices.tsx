"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, Smartphone, Laptop, LogOut, AlertTriangle, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getUserDevices, logoutUserDevice, logoutAllDevices } from "@/services/admin"
import type { UserDevice } from "@/types"

export default function UserDevices() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const { id } = router.query
  const userId = id ? Number(id) : null

  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const [loggingOutDevice, setLoggingOutDevice] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>("User")

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }

    // Load devices
    if (userId) {
      loadDevices()
      loadUserName()
    }
  }, [currentUser, isAdmin, userId, router])

  const loadUserName = async () => {
    if (!userId) return

    try {
      // This is a simplified approach - in a real app, you'd fetch the user details
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`https://phubauth.hasansarker58.workers.dev/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const user = data.users.find((u: any) => u.id === userId)
        if (user) {
          setUserName(user.name || "User")
        }
      }
    } catch (err) {
      console.error("Error loading user name:", err)
    }
  }

  const loadDevices = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Check if token exists
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("No authentication token found. Please log in again.")
        setLoading(false)
        return
      }

      // Get user devices
      const deviceList = await getUserDevices(userId)
      setDevices(deviceList)
    } catch (err: any) {
      console.error("Error loading devices:", err)
      setError("Failed to load user devices. Please try again.")
      toast.error("Failed to load user devices")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadDevices()
  }

  const handleLogoutDevice = async (deviceId: number) => {
    if (!userId) return

    try {
      setLoggingOutDevice(deviceId)
      await logoutUserDevice(userId, deviceId)
      setDevices(devices.filter((d) => d.id !== deviceId))
      toast.success("Device logged out successfully")
    } catch (err: any) {
      console.error("Error logging out device:", err)
      toast.error("Failed to logout device")
    } finally {
      setLoggingOutDevice(null)
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!userId) return

    try {
      setLoggingOutAll(true)
      await logoutAllDevices(userId)
      setDevices([])
      toast.success("All devices logged out successfully")
      setShowLogoutAllConfirm(false)
    } catch (err: any) {
      console.error("Error logging out all devices:", err)
      toast.error("Failed to logout all devices")
    } finally {
      setLoggingOutAll(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
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
    } else if (deviceInfo.toLowerCase().includes("node")) {
      deviceType = "Node.js App"
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

  // Retry loading devices
  const handleRetry = () => {
    loadDevices()
  }

  return (
    <>
      <Head>
        <title>{userName}'s Devices - PremiumHUB</title>
        <meta name="description" content="Manage user devices in PremiumHUB admin dashboard" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="flex items-center">
              <Link
                href={`/admin/users/${userId}`}
                className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-bold text-white">{userName}'s Devices</h1>
            </div>

            <div className="flex mt-4 md:mt-0 space-x-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
                disabled={refreshing}
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Refresh
              </button>

              {devices.length > 0 && (
                <button
                  onClick={() => setShowLogoutAllConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout All Devices
                </button>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Devices List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : devices.length > 0 ? (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {device.device_info?.toLowerCase().includes("mobile") ||
                      device.device_info?.toLowerCase().includes("android") ||
                      device.device_info?.toLowerCase().includes("iphone") ? (
                        <Smartphone className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Laptop className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-white">{formatDeviceName(device)}</p>
                        <p className="text-sm text-gray-400">IP: {device.ip_address}</p>
                        <p className="text-sm text-gray-400">Last active: {formatDate(device.last_login_at)}</p>
                        <p className="text-xs text-gray-500">Device ID: {device.device_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLogoutDevice(device.id)}
                      disabled={loggingOutDevice === device.id}
                      className="mt-4 md:mt-0 text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center self-start md:self-center disabled:opacity-50"
                    >
                      {loggingOutDevice === device.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <LogOut size={16} className="mr-1" />
                          Logout Device
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-400">No devices found</h3>
              <p className="text-gray-500 mt-2">This user has no active devices.</p>
              <Link
                href={`/admin/users/${userId}`}
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Back to User
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logout All Confirmation Modal */}
      {showLogoutAllConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-500 mb-4">
              <AlertTriangle size={24} className="mr-2" />
              <h3 className="text-xl font-bold">Logout All Devices</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to log out all devices for {userName}? This will terminate all active sessions.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutAllConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAllDevices}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                disabled={loggingOutAll}
              >
                {loggingOutAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <LogOut size={18} className="mr-2" />
                    Logout All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
