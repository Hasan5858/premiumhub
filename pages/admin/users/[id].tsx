"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save, Trash, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUser, deleteUser, cancelMembership } from "@/services/admin"
import type { AuthUser } from "@/types"

export default function EditUser() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()
  const { id } = router.query
  const userId = id ? Number(id) : null

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [membershipStatus, setMembershipStatus] = useState("free")

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }

    // Load user data
    if (userId) {
      loadUserData()
    }
  }, [currentUser, isAdmin, userId, router])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // In a real app, you would fetch the user data from the API
      // For now, we'll use the users from the admin service
      const allUsers = await import("@/services/admin").then((module) => module.getAllUsers())
      const userData = allUsers.find((u) => u.id === userId)

      if (!userData) {
        setError("User not found")
        return
      }

      setUser(userData)
      setName(userData.name)
      setEmail(userData.email)
      setMembershipStatus(userData.membership_status)
    } catch (err) {
      console.error("Error loading user data:", err)
      setError("Failed to load user data. Please try again.")
      toast.error("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    try {
      setSaving(true)
      setError(null)

      const userData: Partial<AuthUser> = {
        name,
        email,
        membership_status: membershipStatus,
      }

      // Only include password if it was changed
      if (password) {
        userData.password = password
      }

      await updateUser(userId, userData)
      toast.success("User updated successfully")
      router.push("/admin")
    } catch (err) {
      console.error("Error updating user:", err)
      setError(err instanceof Error ? err.message : "Failed to update user. Please try again.")
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelMembership = async () => {
    if (!userId) return

    try {
      setSaving(true)
      setError(null)
      await cancelMembership(userId)
      toast.success("Membership cancelled successfully")

      // Update local state
      setMembershipStatus("free")
      if (user) {
        setUser({
          ...user,
          membership_status: "free",
          membership_expires_at: null,
        })
      }
    } catch (err) {
      console.error("Error cancelling membership:", err)
      setError("Failed to cancel membership. Please try again.")
      toast.error("Failed to cancel membership")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userId) return

    try {
      setDeleting(true)
      setError(null)
      await deleteUser(userId)
      toast.success("User deleted successfully")
      router.push("/admin")
    } catch (err) {
      console.error("Error deleting user:", err)
      setError("Failed to delete user. Please try again.")
      toast.error("Failed to delete user")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
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

  return (
    <>
      <Head>
        <title>{user ? `Edit User: ${user.name}` : "Edit User"} - PremiumHUB</title>
        <meta name="description" content="Edit user details in PremiumHUB admin dashboard" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/admin" className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-white">{user ? `Edit User: ${user.name}` : "Edit User"}</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Form */}
              <div className="md:col-span-2">
                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                        New Password (leave blank to keep unchanged)
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="membership" className="block text-sm font-medium text-gray-300 mb-1">
                        Membership Status
                      </label>
                      <select
                        id="membership"
                        value={membershipStatus}
                        onChange={(e) => setMembershipStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="free">Free</option>
                        <option value="monthly">Monthly</option>
                        <option value="3month">3 Months</option>
                        <option value="halfyearly">6 Months</option>
                        <option value="yearly">Yearly</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                        disabled={deleting}
                      >
                        <Trash size={18} className="mr-2" />
                        Delete User
                      </button>

                      <div className="flex space-x-3">
                        {user.membership_status !== "free" && user.membership_status !== "admin" && (
                          <button
                            type="button"
                            onClick={handleCancelMembership}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                            disabled={saving}
                          >
                            Cancel Membership
                          </button>
                        )}

                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                          disabled={saving}
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
                  </div>
                </form>
              </div>

              {/* User Info Card */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">User Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">User ID</p>
                    <p className="text-white">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Membership</p>
                    <p className="text-white capitalize">{user.membership_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Expires</p>
                    <p className="text-white">{formatDate(user.membership_expires_at)}</p>
                  </div>
                  <div className="pt-4">
                    <Link
                      href={`/admin/users/${user.id}/devices`}
                      className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Manage Devices
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-400">User not found</h3>
              <p className="text-gray-500 mt-2">The requested user could not be found.</p>
              <Link
                href="/admin"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-500 mb-4">
              <AlertTriangle size={24} className="mr-2" />
              <h3 className="text-xl font-bold">Delete User</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove all
              user data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash size={18} className="mr-2" />
                    Delete User
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
