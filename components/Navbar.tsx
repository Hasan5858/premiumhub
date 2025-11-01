"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlayCircle, Home, Film, LogIn, LogOut, Settings, User, UserCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { logout } from "@/services/auth"

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, setUser, isAdmin } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? "bg-gray-900/95 backdrop-blur-sm shadow-lg" : "bg-gradient-to-b from-gray-900 to-transparent"
      }`}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 text-purple-500">
            <PlayCircle size={20} className="sm:w-6 sm:h-6 stroke-current" />
            <span className="text-base sm:text-lg md:text-xl font-bold">PremiumHUB</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`nav-link ${pathname === "/" ? "text-purple-400" : ""}`}>
              <Home size={18} className="mr-1" />
              <span>Home</span>
            </Link>
            <Link
              href="/categories"
              className={`nav-link ${pathname === "/categories" || (pathname && pathname.startsWith("/category/")) ? "text-purple-400" : ""}`}
            >
              <Film size={18} className="mr-1" />
              <span>Categories</span>
            </Link>
            <Link
              href="/webseries"
              className={`nav-link ${pathname === "/webseries" || (pathname && pathname.startsWith("/webseries/")) ? "text-purple-400" : ""}`}
            >
              <Film size={18} className="mr-1" />
              <span>Webseries</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-1 p-1 sm:p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <UserCircle size={20} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-1">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <User size={16} className="inline mr-2" />
                      My Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Settings size={16} className="inline mr-2" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      href="/membership"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Crown size={16} className="inline mr-2" />
                      Membership
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut size={16} className="inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:block">
                {pathname !== "/login" ? (
                  <Link
                    href="/login"
                    className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors text-xs sm:text-sm"
                  >
                    <LogIn size={16} className="sm:mr-1" />
                    <span className="hidden xs:inline">Sign In</span>
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors text-xs sm:text-sm"
                  >
                    <UserCircle size={16} className="sm:mr-1" />
                    <span className="hidden xs:inline">Sign Up</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
