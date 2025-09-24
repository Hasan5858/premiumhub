import { Play, Star, Calendar, Clock } from "lucide-react"

interface HeroProps {
  id: string
  title: string
  description: string
  backdropImage: string
  year: number
  duration: string
  category: string
  link?: string
}

const HeroSection = ({ id, title, description, backdropImage, year, duration, category }: HeroProps) => {

  return (
    <div className="relative w-full h-[55vh] sm:h-[50vh] md:h-[60vh] lg:h-[75vh] xl:h-[85vh] overflow-hidden">
      {/* Background Image with Enhanced Overlays */}
      <div className="absolute inset-0">
        <img
          src={backdropImage || "/api/placeholder?height=1080&width=1920&query=movie%20backdrop"}
          alt={title}
          className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
          loading="eager"
        />
        
        {/* Multiple Gradient Overlays for Better Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-end">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
          <div className="max-w-xl sm:max-w-2xl lg:max-w-4xl">
            
            {/* Category Badge with Enhanced Design */}
            <div className="hidden sm:inline-flex items-center mb-3 sm:mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-purple-600/90 to-purple-700/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-purple-400/30 shadow-lg">
                <span className="text-white text-xs sm:text-sm font-semibold tracking-wide uppercase">
                  {category}
                </span>
              </div>
              <div className="ml-3 flex items-center space-x-2 text-yellow-400">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="text-xs sm:text-sm font-medium text-white">Featured</span>
              </div>
            </div>

            {/* Title with Responsive Typography */}
            <h1 className="hidden sm:block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent drop-shadow-lg">
                {title}
              </span>
            </h1>

            {/* Metadata Row with Better Mobile Layout */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-purple-400" />
                <span className="text-white text-xs sm:text-sm font-medium">{year}</span>
              </div>
              
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-purple-400" />
                <span className="text-white text-xs sm:text-sm font-medium">{duration}</span>
              </div>
              
              <div className="bg-green-600/80 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-green-400/30">
                HD
              </div>
            </div>

            {/* Description with Better Mobile Readability */}
            <p className="hidden sm:block text-gray-200 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl sm:max-w-2xl">
              {description}
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              {/* Primary Play Button */}
              <button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-600/50 border border-purple-400/30">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 fill-current transition-transform duration-300 group-hover:scale-110" />
                  <span>Watch Now</span>
                </div>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 lg:h-32 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none" />
      
      {/* Side Fade for Better Content Readability */}
      <div className="absolute inset-y-0 left-0 w-8 sm:w-12 md:w-16 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
      
      {/* Ambient Light Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      {/* Progressive Enhancement - Add CSS for unsupported properties */}
      <style jsx>{`
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
        
        @media (max-width: 640px) {
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  )
}

export default HeroSection
