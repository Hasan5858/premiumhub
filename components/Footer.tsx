import Link from "next/link"
import { PlayCircle } from "lucide-react"

const Footer = () => {
  return (
    <footer className="hidden md:block bg-gray-950 pt-12 pb-8 text-gray-400">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {/* Logo and Description */}
          <Link href="/" className="flex items-center space-x-2 text-purple-500 mb-4">
            <PlayCircle size={24} className="stroke-current" />
            <span className="text-xl font-bold">PremiumHUB</span>
          </Link>
          <p className="text-sm max-w-md mb-8">
            Your premium destination for the best streaming content. Discover new favorites and enjoy classics.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} PremiumHUB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
