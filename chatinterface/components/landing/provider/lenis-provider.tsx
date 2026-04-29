"use client"

/*
 * The error means that the package '@studio-freight/react-lenis' is not installed.
 * To fix:
 * 1. Install the package: 
 *    npm install @studio-freight/react-lenis
 *    or
 *    yarn add @studio-freight/react-lenis
 * 2. If you need TypeScript types and they are missing, try:
 *    npm install --save-dev @types/studio-freight__react-lenis
 *    (If no types exist, you can create a declaration file as a workaround.)
 */

// @ts-ignore
import { ReactLenis } from "@studio-freight/react-lenis"
import type { ReactNode } from "react"



export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children as any}
    </ReactLenis>
  )
}