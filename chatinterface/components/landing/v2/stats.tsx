"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView, useReducedMotion } from "framer-motion"
import { Reveal } from "./reveal"
import { SectionHeading } from "./panel"

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? to : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, reduce])

  return <span ref={ref}>{value}</span>
}

/* Product facts, not projected outcomes — each one is true by design. */
const stats = [
  {
    value: "1",
    unit: "line",
    label: "of JavaScript to go live. Webflow, WordPress, Shopify, Next.js — same snippet.",
  },
  {
    prefix: "~",
    count: 5,
    unit: "min",
    label: "from pasting a URL to a widget answering real questions about your product.",
  },
  {
    count: 100,
    unit: "%",
    label: "of answers link the page they came from. No source above threshold, no answer.",
  },
  {
    count: 24,
    unit: "/7",
    label: "in every timezone, replying in whichever language the customer writes in.",
  },
]

export function Stats() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          align="left"
          className="mb-14"
          eyebrow="Why TurboChat"
          title="Support that scales with your docs, not your headcount."
        />

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06} className="bg-card">
              <div className="flex h-full flex-col gap-2.5 p-6 md:p-7">
                <p className="font-display text-[44px] font-medium leading-none tracking-[-0.03em] tabular-nums md:text-[52px]">
                  {stat.prefix}
                  {stat.count ? <CountUp to={stat.count} /> : stat.value}
                  <span className="ml-0.5 align-baseline text-[22px] text-muted-foreground md:text-[26px]">
                    {stat.unit}
                  </span>
                </p>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
