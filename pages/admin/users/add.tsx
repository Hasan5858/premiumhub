"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { ArrowLeft, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { addUser } from "@/services/admin"

export default function AddUser() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [membershipStatus, setMembershipStatus] = useState("free")

  useEffect(() => {
    // Redirect if not admin
    if (user && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
    }
  }, [user, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      // Validate form
      if (!name || !email || !password) {
        setError("All fields are required")
        return
      }

      // Add user
      await addUser({
        name,
        email,
        password,
        membership_status: membershipStatus,
      })

      toast.success("User added successfully")
      router.push("/admin")
    } catch (err) {
      console.error("Error adding user:", err)
      setError(err instanceof Error ? err.message : "Failed to add user. Please try again.")
      toast.error("Failed to add user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Add New User - PremiumHUB</title>
        <meta name="description" content="Add a new user in PremiumHUB admin dashboard" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/admin" className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-white">Add New User</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* User Form */}
          <div className="max-w-2xl mx-auto">
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
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="mr-2" />
                        Add User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
