"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { Users, UserPlus, Search, Filter, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getAllUsers, deleteUser } from "@/services/admin"
import type { AuthUser } from "@/types"

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const usersPerPage = 10

  useEffect(() => {
    // Redirect if not admin
    if (user && !isAdmin) {
      toast.error("You don't have permission to access this page")
      router.push("/")
      return
    }

    loadUsers()
  }, [user, isAdmin, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error("Error loading users:", err)
      setError("Failed to load users. Please try again.")
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || user.membership_status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingUserId(userId)
      await deleteUser(parseInt(userId))
      toast.success("User deleted successfully")
      // Reload users list
      await loadUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeletingUserId(null)
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "free":
        return "bg-gray-600"
      case "monthly":
        return "bg-blue-600"
      case "3month":
        return "bg-green-600"
      case "halfyearly":
        return "bg-purple-600"
      case "yearly":
        return "bg-yellow-600"
      case "admin":
        return "bg-red-600"
      default:
        return "bg-gray-600"
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
        <title>Admin Dashboard - PremiumHUB</title>
        <meta name="description" content="Admin dashboard for PremiumHUB" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and subscriptions</p>
            </div>

            <div className="mt-4 md:mt-0">
              <Link
                href="/admin/users/add"
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <UserPlus size={18} className="mr-2" />
                Add New User
              </Link>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
                placeholder="Search by name or email..."
                className="w-full py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Filter size={18} />
                <span>Filter: {filterStatus === "all" ? "All Memberships" : formatMembershipStatus(filterStatus)}</span>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilterStatus("all")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "all" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      All Memberships
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("free")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "free" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Free
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("monthly")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "monthly" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("3month")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "3month" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      3 Months
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("halfyearly")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "halfyearly" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      6 Months
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("yearly")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "yearly" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yearly
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("admin")
                        setIsFilterOpen(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filterStatus === "admin" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : paginatedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-3 text-sm font-medium text-gray-300 rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Membership</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Expires</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/50">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-800/80 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300">{user.id}</td>
                      <td className="px-4 py-3 text-sm text-white">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            user.membership_status,
                          )}`}
                        >
                          {formatMembershipStatus(user.membership_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{formatDate(user.membership_expires_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/users/${user.id}/devices`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                          >
                            Devices
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deletingUserId === user.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            {deletingUserId === user.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <Users size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400">No users found</h3>
              <p className="text-gray-500 mt-2">Try changing your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-10 h-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
