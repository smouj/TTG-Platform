// ============================================================
// Trading Tazos Game — Scroll Reveal Hook
// Intersection Observer-based reveal animation for any element.
// Zero dependencies, ~1KB gzipped.
// ============================================================
"use client"
import { useEffect, useRef, useState } from "react"

interface UseScrollRevealOptions {
  threshold?: number       // 0-1, % visible to trigger (default 0.1)
  rootMargin?: string      // CSS margin (default "0px 0px -30px 0px")
  once?: boolean           // only trigger once (default true)
  delay?: number           // stagger delay in ms (default 0)
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px 0px -30px 0px", once = true, delay = 0 } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Start hidden
    el.style.opacity = "0"
    el.style.transform = "translateY(12px)"
    el.style.transition = `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
          el.style.opacity = "0"
          el.style.transform = "translateY(12px)"
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold, rootMargin, once, delay])

  return { ref, isVisible }
}
