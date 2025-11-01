"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Film, Crown, Search, UserCircle, Server } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const BottomNavigation = () => {
  const pathname = usePathname()
  const { user } = useAuth()

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
    {
      href: user ? "/profile" : "/login",
      icon: UserCircle,
      label: user ? "Profile" : "Login",
      isActive: pathname === "/profile" || pathname === "/login"
    }
  ]

  return (
    <>
      {/* Safe area padding for devices with home indicator */}
      <div className="md:hidden h-20" />
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Glassmorphism background with enhanced blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-gray-900/90 to-gray-900/80 backdrop-blur-xl" />
        
        {/* Subtle top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        
        {/* Navigation content */}
        <div className="relative px-2 pt-2 pb-safe">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col items-center py-2 px-3 transition-all duration-300 ease-out"
                >
                  {/* Active indicator background */}
                  {item.isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl backdrop-blur-sm border border-purple-500/20 shadow-lg shadow-purple-500/10" />
                  )}
                  
                  {/* Icon container with enhanced hover effects */}
                  <div className="relative z-10 mb-1 transition-all duration-300 group-active:scale-95">
                    {/* Glow effect for active state */}
                    {item.isActive && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg animate-pulse" />
                    )}
                    
                    <Icon 
                      size={22} 
                      className={`relative z-10 transition-all duration-300 ${
                        item.isActive 
                          ? "text-purple-400 drop-shadow-sm" 
                          : "text-gray-400 group-hover:text-gray-300"
                      }`}
                      strokeWidth={item.isActive ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Label with improved typography */}
                  <span 
                    className={`relative z-10 text-[10px] font-medium transition-all duration-300 ${
                      item.isActive 
                        ? "text-purple-300 font-semibold" 
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </span>
                  
                  {/* Ripple effect on tap */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Bottom safe area for devices with home indicator */}
        <div className="h-safe bg-gradient-to-t from-black/95 to-transparent" />
      </div>
    </>
  )
}

export default BottomNavigation
