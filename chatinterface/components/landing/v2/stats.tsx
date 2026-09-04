"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView } from "framer-motion"
import { Reveal } from "./reveal"

function CountUp({ to, decimals = 0, duration = 1.8 }: { to: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [inView, to, duration])

  return <span ref={ref}>{value.toFixed(decimals)}</span>
}

const stats = [
  {
    prefix: "",
    value: 60,
    suffix: "%",
    label: "of repetitive tickets resolved automatically",
    static: false,
  },
  {
    prefix: "",
    value: 5,
    suffix: " min",
    label: "average time from signup to live widget",
    static: false,
  },
  {
    prefix: "",
    value: 24,
    suffix: "/7",
    label: "instant answers, in every timezone",
    static: true,
  },
  {
    prefix: "",
    value: 12,
    suffix: "×",
    label: "faster first response than a human queue",
    static: false,
  },
]

export function Stats() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Why TurboChat
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Support that scales with you, not your headcount.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06} className="bg-card">
              <div className="flex h-full flex-col gap-2 p-6 md:p-8">
                <p className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
                  {stat.prefix}
                  {stat.static ? <span>24</span> : <CountUp to={stat.value} />}
                  <span className="text-violet-600 dark:text-violet-400">{stat.suffix}</span>
                </p>
                <p className="text-sm leading-snug text-muted-foreground">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
