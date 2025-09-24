"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Lock, LogIn, CreditCard, AlertTriangle, RefreshCw } from "lucide-react"
import { getUserDevices } from "@/services/auth"
import DeviceLimitModal from "./DeviceLimitModal"

interface MembershipCheckProps {
  children: React.ReactNode
  fallbackComponent?: React.ReactNode
}

const MembershipCheck = ({ children, fallbackComponent }: MembershipCheckProps) => {
  const { user, refreshUserData } = useAuth()
  const [deviceCount, setDeviceCount] = useState(0)
  const [deviceLimitReached, setDeviceLimitReached] = useState(false)
  const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false)
  const [checkingDevices, setCheckingDevices] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const checkDeviceCount = async () => {
      if (!user) {
        setCheckingDevices(false)
        return
      }

      try {
        const devices = await getUserDevices()
        setDeviceCount(devices.length)
        if (devices.length > 2) {
          setDeviceLimitReached(true)
          setShowDeviceLimitModal(true)
        }
      } catch (error) {
        console.error("Error checking device count:", error)
      } finally {
        setCheckingDevices(false)
      }
    }

    checkDeviceCount()
  }, [user])

  const handleRefreshUserData = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await refreshUserData()
      const devices = await getUserDevices()
      setDeviceCount(devices.length)
      setDeviceLimitReached(devices.length > 2)
    } catch (error) {
      console.error("Error refreshing user data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const hasPremiumAccess =
    user &&
    (user.membership_status === "monthly" ||
      user.membership_status === "3month" ||
      user.membership_status === "halfyearly" ||
      user.membership_status === "yearly" ||
      user.membership_status === "admin")

  if (checkingDevices) {
    return (
      <div className="relative aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (hasPremiumAccess && deviceLimitReached) {
    return (
      <>
        <div className="relative aspect-video">
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Device Limit Reached</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              You have reached the maximum limit of 2 devices. Please remove a device to continue watching.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeviceLimitModal(true)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
              >
                Manage Devices
              </button>
              <button
                onClick={handleRefreshUserData}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
                disabled={refreshing}
              >
                <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        </div>
        <DeviceLimitModal isOpen={showDeviceLimitModal} onClose={() => setShowDeviceLimitModal(false)} />
      </>
    )
  }

  if (!user) {
    return (
      <div className="relative aspect-video">
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-3 sm:p-6 text-center">
            <div className="bg-purple-600/20 p-2 sm:p-4 rounded-full mb-2 sm:mb-4">
              <Lock size={20} className="text-purple-500" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Premium Content</h3>
            <p className="text-xs sm:text-base text-gray-300 mb-3 sm:mb-6 max-w-md px-2">
              This content is exclusive to our members. Please log in to continue watching.
            </p>
            <div className="flex flex-row gap-2 sm:gap-3 w-full justify-center px-3 sm:px-0">
              <Link
                href="/login"
                className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <LogIn size={14} className="mr-1 sm:mr-2" />
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center text-sm sm:text-base"
              >
                Create Account
              </Link>
            </div>
</div>
      </div>
    )
  }

  if (user && user.membership_status === "free") {
    return (
      <div className="relative aspect-video">
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-purple-600/20 p-4 rounded-full mb-4">
            <Lock size={32} className="text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
          <p className="text-gray-300 mb-6 max-w-md">
            This content is exclusive to our premium members. Please upgrade your membership to continue watching.
          </p>
          <div className="flex gap-3">
            <Link
              href="/membership"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
            >
              <CreditCard size={18} className="mr-2" />
              Upgrade Membership
            </Link>
            <button
              onClick={handleRefreshUserData}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
              disabled={refreshing}
            >
              <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default MembershipCheck