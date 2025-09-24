"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserDevices, logoutDevice } from "@/services/auth"
import type { UserDevice } from "@/types"
import { Laptop, Smartphone, LogOut, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"

const DeviceManagement = () => {
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingDevice, setRemovingDevice] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const deviceList = await getUserDevices()
      setDevices(deviceList)
    } catch (err) {
      setError("Failed to load devices")
      toast.error("Could not load device list")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      setRemovingDevice(deviceId)
      await logoutDevice(deviceId)

      // If we're logging out the current device, redirect to login
      const currentDevice = devices.find((d) => d.is_current)
      if (currentDevice && currentDevice.device_id === deviceId) {
        toast.success("Logged out from current device")
        router.push("/login")
        return
      }

      // Otherwise, just update the device list
      setDevices(devices.filter((d) => d.device_id !== deviceId))
      toast.success("Device removed successfully")
    } catch (err) {
      console.error("Failed to logout device:", err)
      toast.error("Failed to remove device. Please try again.")
    } finally {
      setRemovingDevice(null)
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    )
  }

  // Separate current device from other devices
  const currentDevice = devices.find((d) => d.is_current)
  const otherDevices = devices.filter((d) => !d.is_current)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Device Management</h2>
        <div className="text-sm text-gray-400">{devices.length} / 2 devices used</div>
      </div>

      <div className="space-y-4">
        {/* Current Device */}
        {currentDevice && (
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentDevice.device_info?.toLowerCase().includes("mobile") ||
                currentDevice.device_info?.toLowerCase().includes("android") ||
                currentDevice.device_info?.toLowerCase().includes("iphone") ? (
                  <Smartphone className="w-6 h-6 text-purple-400" />
                ) : (
                  <Laptop className="w-6 h-6 text-purple-400" />
                )}
                <div>
                  <p className="font-medium text-white">{formatDeviceName(currentDevice)}</p>
                  <p className="text-sm text-gray-400">Current Device</p>
                  <p className="text-xs text-gray-500">IP: {currentDevice.ip_address}</p>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(currentDevice.last_login_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleLogoutDevice(currentDevice.device_id)}
                disabled={removingDevice === currentDevice.device_id}
                className="text-sm px-3 py-1 text-red-400 hover:text-red-300 transition-colors flex items-center disabled:opacity-50"
              >
                {removingDevice === currentDevice.device_id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400 mr-1"></div>
                ) : (
                  <LogOut size={16} className="mr-1" />
                )}
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Other Devices */}
        {otherDevices.map((device) => (
          <div key={device.device_id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
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
                  <p className="text-sm text-gray-400">
                    Last active: {new Date(device.last_login_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">IP: {device.ip_address}</p>
                </div>
              </div>
              <button
                onClick={() => handleLogoutDevice(device.device_id)}
                disabled={removingDevice === device.device_id}
                className="text-sm px-3 py-1 text-red-400 hover:text-red-300 transition-colors flex items-center disabled:opacity-50"
              >
                {removingDevice === device.device_id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400 mr-1"></div>
                ) : (
                  <LogOut size={16} className="mr-1" />
                )}
                Remove
              </button>
            </div>
          </div>
        ))}

        {devices.length === 0 && <p className="text-center text-gray-400 py-8">No devices found</p>}
      </div>
    </div>
  )
}

export default DeviceManagement
