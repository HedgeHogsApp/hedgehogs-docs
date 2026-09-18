import { useEffect, useState } from 'react'

export function useResponsiveIconSize(baseSize: number) {
  const [size, setSize] = useState(baseSize)

  useEffect(() => {
    function handleResize() {
      // Mobile: 1.0x base size (no reduction)
      if (window.innerWidth < 640) {
        setSize(baseSize)
      }
      // Tablet: 1.1x base size
      else if (window.innerWidth < 1024) {
        setSize(Math.round(baseSize * 1.1))
      }
      // Desktop: 1.2x base size
      else {
        setSize(Math.round(baseSize * 1.2))
      }
    }

    // Initial size calculation
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [baseSize])

  return size
}
