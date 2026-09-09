"use client"

import { useEffect, type ReactNode } from "react"
import { ReactLenis, useLenis } from "@studio-freight/react-lenis"
import { useReducedMotion } from "framer-motion"

/* the fixed nav occupies pt-4 (16) + h-14 (56); leave a little air under it */
const NAV_OFFSET = 88

/*
 * Lenis interpolates with either `lerp` or `duration` — never both. The old
 * config set both, so the wheel ran on lerp (0.08, very floaty) while
 * programmatic scrolls ran on duration: two different feels on one page.
 * One model now, weighted close to native so the page tracks the wheel.
 */
const OPTIONS = {
  lerp: 0.12,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
  syncTouch: false, // touch stays native; Lenis on touch fights the OS
  autoResize: true,
}

/*
 * In-page anchors, routed through Lenis.
 *
 * Left alone, a hash link scrolls natively (next/link pushes the hash, the
 * browser jumps) while Lenis is mid-animation on the same scroll position —
 * the two fight and the page lands somewhere arbitrary. Capture-phase means
 * this runs before next/link's own handler, which bails on defaultPrevented.
 */
function AnchorScroll() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return
    const instance = lenis

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as Element | null)?.closest?.("a")
      const href = anchor?.getAttribute("href")
      if (!href || href.length < 2 || !href.startsWith("#")) return

      const target = document.getElementById(href.slice(1))
      if (!target) return

      event.preventDefault()
      instance.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.05 })
      window.history.replaceState(null, "", href)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [lenis])

  return null
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()

  const tree = (
    <>
      <AnchorScroll />
      {children}
    </>
  )

  return (
    <ReactLenis root options={{ ...OPTIONS, smoothWheel: !reduce }}>
      {/* react-lenis bundles its own @types/react copy, so ReactNode is a
          structurally identical but nominally different type — hence the cast */}
      {tree as any}
    </ReactLenis>
  )
}
