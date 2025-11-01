import { useEffect, useRef, useState } from 'react'
import Artplayer from 'artplayer'

interface ArtPlayerProps {
  option: any
  getInstance?: (art: Artplayer) => void
  style?: React.CSSProperties
  className?: string
}

export default function ArtPlayerComponent({
  option,
  getInstance,
  style,
  className = '',
  ...rest
}: ArtPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null)
  const artInstanceRef = useRef<Artplayer | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Inject ArtPlayer CSS dynamically if not already present
    const styleId = 'artplayer-styles'
    if (!document.getElementById(styleId) && typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.id = styleId
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/artplayer@5.1.7/dist/artplayer.css'
      link.onload = () => setIsReady(true)
      link.onerror = () => setIsReady(true) // Continue even if CSS fails
      document.head.appendChild(link)
    } else {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isClient || !isReady || !artRef.current) return

    // Add a small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (!artRef.current) return

      // Clean up previous instance
      if (artInstanceRef.current) {
        try {
          artInstanceRef.current.destroy(false)
        } catch (e) {
          console.error('Error destroying artplayer:', e)
        }
        artInstanceRef.current = null
      }

      try {
        // Create new instance
        const art = new Artplayer({
          ...option,
          container: artRef.current,
        })

        artInstanceRef.current = art

        // Pass instance to parent if callback provided
        if (getInstance && typeof getInstance === 'function') {
          getInstance(art)
        }

        // Add event listeners for debugging
        art.on('ready', () => {
          console.log('ArtPlayer ready')
        })

        art.on('error', (error) => {
          console.error('ArtPlayer error:', error)
        })
      } catch (e) {
        console.error('Error creating artplayer:', e)
      }
    }, 100)

    // Cleanup on unmount
    return () => {
      clearTimeout(timer)
      if (artInstanceRef.current) {
        try {
          artInstanceRef.current.destroy(false)
        } catch (e) {
          console.error('Error in cleanup:', e)
        }
        artInstanceRef.current = null
      }
    }
  }, [isClient, isReady, option, getInstance])

  if (!isClient) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        className={className}
      >
        <div className="text-gray-400">Loading player...</div>
      </div>
    )
  }

  return (
    <div
      ref={artRef}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
      className={className}
      {...rest}
    />
  )
}
