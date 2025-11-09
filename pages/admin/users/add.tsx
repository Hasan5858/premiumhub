import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save, User, Mail, Calendar, CreditCard, Lock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { addUser } from "@/services/admin"

export default function AddUserPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [membershipStatus, setMembershipStatus] = useState("free")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }
  }, [currentUser, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!password) {
      setError("Password is required")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setSaving(true)

      // Prepare user data
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        membership_status: membershipStatus,
      }

      await addUser(userData)

      toast.success("User created successfully")
      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err) {
      console.error("Error adding user:", err)
      setError(err instanceof Error ? err.message : "Failed to create user. Please try again.")
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setSaving(false)
    }
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

  return (
    <>
      <Head>
        <title>Add New User - Admin Dashboard</title>
        <meta name="description" content="Add a new user to the system" />
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
                <h1 className="text-3xl font-bold text-white">Add New User</h1>
                <p className="text-gray-400 mt-1">Create a new user account</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Add User Form */}
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
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
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
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
                    placeholder="Enter email address"
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
                    onChange={(e) => setMembershipStatus(e.target.value)}
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
                <p className="text-xs text-gray-400 mt-1">
                  Expiry date will be automatically calculated based on the selected membership plan.
                </p>
              </div>

              {/* Password */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Lock size={18} className="mr-2" />
                  Set Password <span className="text-red-400">*</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 space-x-4">
                <Link
                  href="/admin"
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Create User
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

