"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { User, Mail, Lock, Save, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserProfile } from "@/services/auth"
import DeviceManagement from "@/components/DeviceManagement"

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Initialize form with user data
    setName(user.name)
    setEmail(user.email)
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match if changing password
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    try {
      setLoading(true)

      const data: {
        name?: string
        email?: string
        current_password?: string
        new_password?: string
      } = {}

      // Only include fields that have changed
      if (name !== user?.name) data.name = name
      if (email !== user?.email) data.email = email
      if (newPassword) {
        data.current_password = currentPassword
        data.new_password = newPassword
      }

      // Don't submit if nothing changed
      if (Object.keys(data).length === 0) {
        toast.info("No changes to save")
        setLoading(false)
        return
      }

      const response = await updateUserProfile(data)

      // Update user in context
      if (response.success && response.user) {
        setUser(response.user)
        toast.success("Profile updated successfully")

        // Clear password fields
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile. Please try again.")
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format membership status for display
  const formatMembershipStatus = (status: string) => {
    switch (status) {
      case "free":
        return "Free"
      case "monthly":
        return "Monthly"
      case "3month":
        return "3 Months"
      case "halfyearly":
        return "6 Months"
      case "yearly":
        return "Yearly"
      case "admin":
        return "Admin"
      default:
        return status
    }
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <>
      <Head>
        <title>My Profile - PremiumHUB</title>
        <meta name="description" content="Manage your PremiumHUB profile and account settings" />
      </Head>

      <div className="pb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-8">My Account</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </div>

                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "profile"
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <User size={18} className="mr-3" />
                    Profile
                  </button>

                  <button
                    onClick={() => setActiveTab("membership")}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "membership"
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <CreditCard size={18} className="mr-3" />
                    Membership
                  </button>

                  <button
                    onClick={() => setActiveTab("devices")}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "devices"
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Lock size={18} className="mr-3" />
                    Devices
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {activeTab === "profile" && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-gray-500" />
                          </div>
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={18} className="text-gray-500" />
                          </div>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-700">
                        <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>

                        <div className="space-y-4">
                          <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">
                              Current Password
                            </label>
                            <input
                              id="current-password"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
                              New Password
                            </label>
                            <input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} className="mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "membership" && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Membership Details</h2>

                  <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          Current Plan: {formatMembershipStatus(user.membership_status)}
                        </h3>
                        {user.membership_expires_at && (
                          <p className="text-gray-300">
                            Expires: <span className="text-white">{formatDate(user.membership_expires_at)}</span>
                          </p>
                        )}
                      </div>

                      {user.membership_status !== "admin" && (
                        <Link
                          href="/membership"
                          className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          {user.membership_status === "free" ? "Upgrade Plan" : "Manage Plan"}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Available Plans</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Free Plan */}
                        <div
                          className={`bg-gray-700 rounded-lg p-4 border-2 ${user.membership_status === "free" ? "border-purple-500" : "border-transparent"}`}
                        >
                          <h4 className="text-lg font-medium text-white mb-2">Free</h4>
                          <p className="text-2xl font-bold text-white mb-4">$0</p>
                          <ul className="text-gray-300 space-y-2 mb-4">
                            <li>• Limited access</li>
                            <li>• Standard quality</li>
                            <li>• Basic features</li>
                          </ul>
                          {user.membership_status !== "free" && (
                            <button className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
                              Downgrade
                            </button>
                          )}
                        </div>

                        {/* Monthly Plan */}
                        <div
                          className={`bg-gray-700 rounded-lg p-4 border-2 ${user.membership_status === "monthly" ? "border-purple-500" : "border-transparent"}`}
                        >
                          <h4 className="text-lg font-medium text-white mb-2">Monthly</h4>
                          <p className="text-2xl font-bold text-white mb-4">$9.99</p>
                          <ul className="text-gray-300 space-y-2 mb-4">
                            <li>• Full access</li>
                            <li>• HD quality</li>
                            <li>• No ads</li>
                          </ul>
                          {user.membership_status !== "monthly" && (
                            <Link
                              href="/membership?plan=monthly"
                              className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                              {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                            </Link>
                          )}
                        </div>

                        {/* 6 Month Plan */}
                        <div
                          className={`bg-gray-700 rounded-lg p-4 border-2 ${user.membership_status === "halfyearly" ? "border-purple-500" : "border-transparent"}`}
                        >
                          <h4 className="text-lg font-medium text-white mb-2">6 Months</h4>
                          <p className="text-2xl font-bold text-white mb-4">$49.99</p>
                          <ul className="text-gray-300 space-y-2 mb-4">
                            <li>• Full access</li>
                            <li>• 4K quality</li>
                            <li>• No ads</li>
                            <li>• Save 17%</li>
                          </ul>
                          {user.membership_status !== "halfyearly" && (
                            <Link
                              href="/membership?plan=halfyearly"
                              className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                              {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                            </Link>
                          )}
                        </div>

                        {/* Yearly Plan */}
                        <div
                          className={`bg-gray-700 rounded-lg p-4 border-2 ${user.membership_status === "yearly" ? "border-purple-500" : "border-transparent"}`}
                        >
                          <h4 className="text-lg font-medium text-white mb-2">Yearly</h4>
                          <p className="text-2xl font-bold text-white mb-4">$89.99</p>
                          <ul className="text-gray-300 space-y-2 mb-4">
                            <li>• Full access</li>
                            <li>• 4K quality</li>
                            <li>• No ads</li>
                            <li>• Save 25%</li>
                          </ul>
                          {user.membership_status !== "yearly" && (
                            <Link
                              href="/membership?plan=yearly"
                              className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                              {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "devices" && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Device Management</h2>
                  <DeviceManagement />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
