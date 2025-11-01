"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save, User, Mail, Calendar, CreditCard, Lock, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getUserById, updateUser, deleteUser } from "@/services/admin"
import type { AuthUser } from "@/types"

export default function EditUserPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [membershipStatus, setMembershipStatus] = useState("free")
  const [expiryDate, setExpiryDate] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }

    // Wait for router to be ready and have id
    if (router.isReady && id) {
      loadUser()
    }
  }, [currentUser, isAdmin, router.isReady, id, router])

  const loadUser = async () => {
    if (!id || typeof id !== "string") return

    try {
      setLoading(true)
      setError(null)
      const userId = parseInt(id)
      if (isNaN(userId)) {
        setError("Invalid user ID")
        return
      }
      const userData = await getUserById(userId)
      if (!userData) {
        setError("User not found")
        toast.error("User not found")
        return
      }

      setUser(userData)
      setName(userData.name)
      setEmail(userData.email)
      setMembershipStatus(userData.membership_status || "free")
      
      // Format expiry date for input field (YYYY-MM-DD)
      if (userData.membership_expires_at) {
        const date = new Date(userData.membership_expires_at)
        const formattedDate = date.toISOString().split("T")[0]
        setExpiryDate(formattedDate)
      } else {
        setExpiryDate("")
      }
    } catch (err) {
      console.error("Error loading user:", err)
      setError("Failed to load user. Please try again.")
      toast.error("Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match if changing password
    if (password && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      setSaving(true)

      // Prepare update data
      const updateData: Partial<AuthUser> = {}

      // Only include fields that have changed
      if (name !== user?.name) updateData.name = name
      if (email !== user?.email) updateData.email = email
      if (membershipStatus !== user?.membership_status) {
        updateData.membership_status = membershipStatus
      }

      // Handle expiry date:
      // - If manually set (not empty), use the manual date (this takes precedence)
      // - If empty and membership is free/admin, set to null
      // - If empty for paid plan, don't include it (auto-calculates if membership_status changed)
      if (expiryDate) {
        // Manual date override - always use this if provided
        const dateObj = new Date(expiryDate)
        updateData.membership_expires_at = dateObj.toISOString()
      } else if (membershipStatus === "free" || membershipStatus === "admin") {
        // Explicitly set to null for free/admin plans
        updateData.membership_expires_at = null
      }
      // Note: If expiryDate is empty and membership is paid, we don't set membership_expires_at
      // This allows the updateUser function to auto-calculate if membership_status changed

      // Handle password - only send if provided
      if (password) {
        ;(updateData as any).password = password
      }

      // Don't submit if nothing changed
      if (Object.keys(updateData).length === 0 && !password) {
        toast.info("No changes to save")
        setSaving(false)
        return
      }

      if (!id || typeof id !== "string") {
        setError("Invalid user ID")
        return
      }
      const userId = parseInt(id)
      if (isNaN(userId)) {
        setError("Invalid user ID")
        return
      }
      await updateUser(userId, updateData)

      toast.success("User updated successfully")
      
      // Clear password fields
      setPassword("")
      setConfirmPassword("")
      
      // Reload user data
      await loadUser()
    } catch (err) {
      console.error("Error updating user:", err)
      setError(err instanceof Error ? err.message : "Failed to update user. Please try again.")
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!id || typeof id !== "string") return

    if (!user) return

    if (
      !confirm(
        `Are you sure you want to delete user "${user.name}" (${user.email})? This action cannot be undone and will permanently delete all user data.`,
      )
    ) {
      return
    }

    try {
      setDeleting(true)
      const userId = parseInt(id)
      await deleteUser(userId)
      toast.success("User deleted successfully")
      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(err instanceof Error ? err.message : "Failed to delete user. Please try again.")
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
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

  if (loading) {
    return (
      <>
        <Head>
          <title>Edit User - Admin Dashboard</title>
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
        <title>Edit User - Admin Dashboard</title>
        <meta name="description" content="Edit user details" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4 max-w-4xl">
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
                <h1 className="text-3xl font-bold text-white">Edit User</h1>
                <p className="text-gray-400 mt-1">User ID: {user.id}</p>
              </div>
            </div>
            <button
              onClick={handleDeleteUser}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} className="mr-2" />
                  Delete User
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Current User Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Current User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Current Status:</span>
                <span className="text-white ml-2">{formatMembershipStatus(user.membership_status || "free")}</span>
              </div>
              <div>
                <span className="text-gray-400">Current Expiry:</span>
                <span className="text-white ml-2">{formatDate(user.membership_expires_at || null)}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
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
                    required
                    className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
                    required
                    className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Membership Status */}
              <div>
                <label htmlFor="membership-status" className="block text-sm font-medium text-gray-300 mb-2">
                  Membership Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard size={18} className="text-gray-500" />
                  </div>
                  <select
                    id="membership-status"
                    value={membershipStatus}
                    onChange={(e) => {
                      setMembershipStatus(e.target.value)
                      // Clear expiry date if switching to free/admin
                      if (e.target.value === "free" || e.target.value === "admin") {
                        setExpiryDate("")
                      }
                    }}
                    className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="free">Free</option>
                    <option value="monthly">Monthly</option>
                    <option value="3month">3 Months</option>
                    <option value="halfyearly">6 Months</option>
                    <option value="yearly">Yearly</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date - Manual Edit */}
              <div>
                <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date (Manual Override)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-500" />
                  </div>
                  <input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={membershipStatus === "free" || membershipStatus === "admin"}
                    className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {membershipStatus === "free" || membershipStatus === "admin"
                    ? "Expiry date is not applicable for free/admin users"
                    : "Leave empty to auto-calculate based on membership plan, or set a custom date"}
                </p>
              </div>

              {/* Password Change */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Lock size={18} className="mr-2" />
                  Change Password (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Leave empty to keep current password. Changing password will not affect membership plan or expiry date.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
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
      </div>
    </>
  )
}

