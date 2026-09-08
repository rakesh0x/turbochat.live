"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useInView, useReducedMotion } from "framer-motion"
import { Reveal } from "./reveal"

/* ------------------------------------------------------------------ *
 * Landing surface primitives.
 *
 * One card look for the whole page. Two rules keep it honest:
 *   1. Chrome is monochrome — mono eyebrow, foreground-tinted icon. No
 *      per-card accent colour, no candy icon chips.
 *   2. Every card ends in a `Stage`: a recessed well holding a fragment
 *      of real product UI that bleeds off the bottom edge, so the card
 *      reads as a screenshot rather than an illustration.
 * ------------------------------------------------------------------ */

export function Card({
  className = "",
  children,
  delay = 0,
  interactive = true,
}: {
  className?: string
  children: ReactNode
  delay?: number
  interactive?: boolean
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div
        className={`tc-raise group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card ${
          interactive
            ? "transition-[transform,border-color] duration-300 hover:-translate-y-px hover:border-foreground/20"
            : ""
        }`}
      >
        {children}
      </div>
    </Reveal>
  )
}

export function CardBody({
  eyebrow,
  icon,
  title,
  children,
  className = "",
}: {
  eyebrow: string
  icon?: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`p-6 pb-5 ${className}`}>
      <div className="mb-3.5 flex items-center gap-2 text-muted-foreground">
        {icon ? <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span> : null}
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{eyebrow}</span>
      </div>
      <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

export function Stage({
  className = "",
  children,
  label,
  stageRef,
}: {
  className?: string
  children: ReactNode
  label?: string
  stageRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={stageRef}
      className={`tc-well relative mt-auto overflow-hidden border-t border-border/70 bg-muted/45 ${className}`}
    >
      {label ? (
        <div className="flex items-center justify-between border-b border-border/60 bg-background/50 px-4 py-2">
          <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
          <span className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-foreground/20" />
            <span className="h-1 w-1 rounded-full bg-foreground/20" />
            <span className="h-1 w-1 rounded-full bg-foreground/20" />
          </span>
        </div>
      ) : null}
      {children}
    </div>
  )
}

/**
 * Plays a card's mini-workflow once, the first time it scrolls into view.
 * Reduced motion jumps straight to the final frame.
 */
export function useStageSequence(frames: number, step = 520) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" })
  const reduce = useReducedMotion()
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (reduce) {
      setFrame(frames - 1)
      return
    }
    if (!inView) return
    const timers = Array.from({ length: frames - 1 }, (_, i) =>
      setTimeout(() => setFrame(i + 1), step * (i + 1)),
    )
    return () => timers.forEach(clearTimeout)
  }, [inView, reduce, frames, step])

  return { ref, frame, done: frame >= frames - 1 }
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  className = "",
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  align?: "center" | "left"
  className?: string
}) {
  const centered = align === "center"
  return (
    <Reveal className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      <div className={`mb-4 flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
        <span className="h-px w-6 bg-foreground/25" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</span>
        <span className={`h-px w-6 bg-foreground/25 ${centered ? "" : "hidden"}`} />
      </div>
      <h2 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.02em] sm:text-4xl md:text-[46px]">
        {title}
      </h2>
      {lead ? (
        <p className={`mt-4 text-[17px] leading-relaxed text-muted-foreground ${centered ? "" : ""}`}>{lead}</p>
      ) : null}
    </Reveal>
  )
}
