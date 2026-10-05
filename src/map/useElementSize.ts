import { useEffect, useRef, useState } from 'react'

/**
 * Tracks an element's rendered size. The map needs real pixel dimensions to
 * fit the projection, and a fixed viewBox would letterbox between the phone
 * and desktop layouts.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.round(width), height: Math.round(height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}
