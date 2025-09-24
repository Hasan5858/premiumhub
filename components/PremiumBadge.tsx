
import { Crown } from "lucide-react"

interface PremiumBadgeProps {
  className?: string
}

const PremiumBadge = ({ className = "" }: PremiumBadgeProps) => {
  return (
    <div
      className={`absolute top-1 left-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-full flex items-center shadow-lg ${className}`}
    >
      <div className="sm:hidden">
        {/* Mobile: Only crown icon */}
        <Crown size={12} className="p-1" />
      </div>
      <div className="hidden sm:flex items-center text-[8px] px-1 py-0.5">
        <Crown size={8} className="mr-0.5" />
        <span className="font-medium">PREMIUM</span>
      </div>
    </div>
  )
}

export default PremiumBadge
