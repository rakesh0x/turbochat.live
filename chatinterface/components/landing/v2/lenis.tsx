"use client"

import type { ReactNode } from "react"
import { ReactLenis } from "@studio-freight/react-lenis"

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.3, smoothWheel: true }}>
      {children as any}
    </ReactLenis>
  )
}
