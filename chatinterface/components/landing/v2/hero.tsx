"use client"

import { ArrowRight, Globe, Sparkles, Star } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { ProductMockup } from "./product-mockup"

const avatars = [
  { initials: "MC", from: "from-violet-500", to: "to-fuchsia-500" },
  { initials: "DR", from: "from-sky-500", to: "to-indigo-500" },
  { initials: "PN", from: "from-amber-500", to: "to-orange-500" },
  { initials: "JT", from: "from-emerald-500", to: "to-teal-500" },
  { initials: "AK", from: "from-rose-500", to: "to-pink-500" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-32 md:pt-40">
      {/* background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 tc-bg-grid [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-200px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300/50 via-fuchsia-200/40 to-indigo-300/50 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          {/* announcement */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border bg-background/70 py-1.5 pl-2 pr-3.5 text-[13px] text-muted-foreground shadow-sm backdrop-blur">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              <Sparkles className="h-3 w-3" />
              New
            </span>
            One-line embed · live in minutes
            <ArrowRight className="h-3.5 w-3.5" />
          </div>

          {/* headline */}
          <h1 className="font-serif text-[44px] font-medium leading-[1.02] tracking-[-0.03em] sm:text-6xl md:text-[76px]">
            Put customer support
            <br className="hidden sm:block" /> on{" "}
            <span className="italic">
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">
                autopilot.
              </span>
            </span>
          </h1>

          {/* subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            TurboChat trains on your website, docs, and PDFs — then answers customers instantly, in your brand&apos;s
            voice. Launch in minutes, not sprints.
          </p>

          {/* CTA bar */}
          <div className="mx-auto mt-9 flex max-w-xl flex-col items-center gap-3">
            <div className="flex w-full flex-col gap-2 rounded-2xl border bg-card p-2 shadow-xl shadow-violet-600/5 sm:flex-row sm:items-center sm:rounded-full">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label="Your website URL"
                  placeholder="yourwebsite.com"
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <button
                onClick={() => signInWithGoogle()}
                className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition-all hover:bg-violet-500"
              >
                Train my agent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Free forever plan · No credit card · Live in ~5 minutes</p>
          </div>

          {/* social proof */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
            <div className="flex -space-x-2.5">
              {avatars.map((a) => (
                <span
                  key={a.initials}
                  className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${a.from} ${a.to} text-[10px] font-bold text-white ring-2 ring-background`}
                >
                  {a.initials}
                </span>
              ))}
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="flex flex-col items-center gap-0.5 sm:items-start">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1 text-sm font-semibold">4.9/5</span>
              </div>
              <p className="text-xs text-muted-foreground">from 2,300+ support teams shipping faster</p>
            </div>
          </div>
        </div>

        {/* product visual */}
        <ProductMockup />
      </div>
    </section>
  )
}
