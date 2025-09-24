"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Smartphone, Laptop, AlertTriangle, LogOut, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { getUserDevices, logoutDevice } from "@/services/auth"
import type { UserDevice } from "@/types"

interface DeviceLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

const DeviceLimitModal = ({ isOpen, onClose }: DeviceLimitModalProps) => {
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingDevice, setRemovingDevice] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadDevices()
    }
  }, [isOpen])

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

      // If we now have fewer than 2 devices, close the modal
      if (devices.length <= 3) {
        onClose()
      }
    } catch (err) {
      toast.error("Failed to remove device")
    } finally {
      setRemovingDevice(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center text-red-500">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-semibold">Device Limit Reached</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : (
            <>
              <p className="text-gray-300 mb-6">
                You have reached the maximum limit of 2 devices. Please remove a device to continue watching.
              </p>

              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                {devices.map((device) => (
                  <div
                    key={device.device_id}
                    className={`${
                      device.is_current ? "bg-gray-700/80 border-2 border-purple-500/50" : "bg-gray-700"
                    } rounded-lg p-4 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {device.device_info.toLowerCase().includes("mobile") ? (
                          <Smartphone
                            className={`w-6 h-6 ${device.is_current ? "text-purple-400" : "text-gray-400"}`}
                          />
                        ) : (
                          <Laptop className={`w-6 h-6 ${device.is_current ? "text-purple-400" : "text-gray-400"}`} />
                        )}
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium text-white">{device.device_info}</p>
                            {device.is_current && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          {device.is_current ? (
                            <p className="text-sm text-purple-400">This device</p>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Last active: {new Date(device.last_login_at).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">IP: {device.ip_address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLogoutDevice(device.device_id)}
                        disabled={removingDevice === device.device_id}
                        className={`text-sm px-3 py-1 ${
                          device.is_current ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-gray-300"
                        } transition-colors flex items-center disabled:opacity-50`}
                      >
                        {removingDevice === device.device_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400 mr-1"></div>
                        ) : (
                          <LogOut size={16} className="mr-1" />
                        )}
                        {device.is_current ? "Logout" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeviceLimitModal
