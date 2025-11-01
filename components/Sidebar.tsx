"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  PlayCircle, 
  Home, 
  Film, 
  Crown, 
  LogIn, 
  LogOut, 
  Settings, 
  User, 
  UserCircle,
  Menu,
  X,
  ChevronRight,
  Server
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import { logout } from "@/services/auth"

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, setUser, isAdmin } = useAuth()
  const { isCollapsed, toggleCollapse } = useSidebar()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      isActive: pathname === "/"
    },
    {
      href: "/categories",
      icon: Film,
      label: "Categories",
      isActive: pathname === "/categories" || (pathname && pathname.startsWith("/category/"))
    },
    {
      href: "/webseries",
      icon: Crown,
      label: "Webseries",
      isActive: pathname === "/webseries" || (pathname && pathname.startsWith("/webseries/"))
    },
    {
      href: "/provider/indianpornhq",
      icon: Server,
      label: "Providers",
      isActive: pathname && pathname.startsWith("/provider/")
    },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700/50 text-white hover:bg-gray-700/90 transition-all duration-300"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Logo */}
      <Link 
        href="/" 
        className="md:hidden fixed top-4 left-16 z-50 flex items-center space-x-2 text-purple-500 bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700/50"
      >
        <PlayCircle size={20} className="stroke-current" />
        <span className="text-sm font-bold">PremiumHUB</span>
      </Link>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${isCollapsed ? 'w-16' : 'w-72'}
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
        border-r border-gray-700/50 shadow-2xl
      `}>
        {/* Sidebar Header */}
        <div className={`flex items-center border-b border-gray-700/50 ${isCollapsed ? 'justify-center p-4' : 'justify-between p-6'}`}>
          <Link href="/" className={`flex items-center text-purple-500 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <PlayCircle size={24} className="stroke-current text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold">PremiumHUB</h1>
                <p className="text-xs text-gray-400">Premium Content</p>
              </div>
            )}
          </Link>
          
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              {/* Collapse button for desktop */}
              <button
                onClick={toggleCollapse}
                className="hidden md:block p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
              >
                <Menu size={20} />
              </button>
              
              {/* Close button for mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          )}
          
          {/* Collapse button for collapsed state */}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="absolute top-4 right-2 p-1 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
              title="Expand sidebar"
            >
              <Menu size={16} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 py-6 space-y-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center transition-all duration-300
                  ${isCollapsed 
                    ? 'justify-center p-3 rounded-lg' 
                    : 'px-4 py-3 rounded-xl'
                  }
                  ${item.isActive 
                    ? isCollapsed
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-lg'
                  }
                `}
                title={isCollapsed ? item.label : ''}
              >
                {isCollapsed ? (
                  // Collapsed state: Clean icon only
                  <Icon 
                    size={24} 
                    strokeWidth={item.isActive ? 2.5 : 2}
                    className={`
                      transition-all duration-300
                      ${item.isActive 
                        ? 'text-purple-400' 
                        : 'text-gray-400 group-hover:text-purple-400'
                      }
                    `}
                  />
                ) : (
                  // Expanded state: Icon with background and text
                  <>
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
                      ${item.isActive 
                        ? 'bg-purple-600/30 text-purple-400' 
                        : 'bg-gray-700/50 text-gray-400 group-hover:bg-purple-600/20 group-hover:text-purple-400'
                      }
                    `}>
                      <Icon size={20} strokeWidth={item.isActive ? 2.5 : 2} />
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <span className="font-medium">{item.label}</span>
                    </div>
                    
                    {item.isActive && (
                      <ChevronRight size={16} className="text-purple-400" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className={`border-t border-gray-700/50 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {user ? (
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className={`
                  w-full flex items-center transition-all duration-300 rounded-lg
                  ${isCollapsed 
                    ? 'justify-center p-3 hover:bg-gray-700/50' 
                    : 'p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/30 hover:border-purple-500/30'
                  }
                `}
                title={isCollapsed ? user.name : ''}
              >
                {isCollapsed ? (
                  // Collapsed state: Clean avatar only
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                    <UserCircle size={20} className="text-white" />
                  </div>
                ) : (
                  // Expanded state: Full user info
                  <>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                      <UserCircle size={24} className="text-white" />
                    </div>
                    
                    <div className="ml-4 flex-1 text-left">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    
                    <ChevronRight 
                      size={16} 
                      className={`text-gray-400 transition-transform duration-300 ${
                        isUserMenuOpen ? 'rotate-90' : ''
                      }`} 
                    />
                  </>
                )}
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <User size={16} className="mr-3" />
                    My Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <Settings size={16} className="mr-3" />
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    href="/membership"
                    className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <Crown size={16} className="mr-3" />
                    Membership
                  </Link>

                  <div className="border-t border-gray-700/50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {pathname !== "/login" ? (
                <Link
                  href="/login"
                  className={`
                    w-full flex items-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 rounded-lg
                    ${isCollapsed 
                      ? 'justify-center p-3' 
                      : 'px-4 py-3 rounded-xl'
                    }
                  `}
                  title={isCollapsed ? 'Sign In' : ''}
                >
                  <LogIn size={isCollapsed ? 20 : 18} className={isCollapsed ? '' : 'mr-2'} />
                  {!isCollapsed && 'Sign In'}
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className={`
                    w-full flex items-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 rounded-lg
                    ${isCollapsed 
                      ? 'justify-center p-3' 
                      : 'px-4 py-3 rounded-xl'
                    }
                  `}
                  title={isCollapsed ? 'Sign Up' : ''}
                >
                  <UserCircle size={isCollapsed ? 20 : 18} className={isCollapsed ? '' : 'mr-2'} />
                  {!isCollapsed && 'Sign Up'}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`border-t border-gray-700/50 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed && (
            <div className="text-center text-xs text-gray-500">
              <p>© 2024 PremiumHUB</p>
              <p className="mt-1">Premium Entertainment</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
