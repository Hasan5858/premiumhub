import type React from "react"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Footer from "./Footer"
import BottomNavigation from "./BottomNavigation"
import { useSidebar } from "@/contexts/SidebarContext"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Mobile Navbar */}
      <div className="md:hidden">
        <Navbar />
      </div>
      
      {/* Desktop Layout with Sidebar */}
      <div className="hidden md:block">
        {/* Desktop Sidebar - Fixed Position */}
        <Sidebar />
        
        {/* Main Content Area - Scrollable */}
        <main 
          className="pb-16 overflow-y-auto min-h-screen transition-all duration-300"
          style={{ marginLeft: isCollapsed ? '4rem' : '18rem' }}
        >
          {children}
        </main>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        <main className="pb-24">
          {children}
        </main>
      </div>
      
      <Footer />
      <BottomNavigation />
    </div>
  )
}

export default Layout
