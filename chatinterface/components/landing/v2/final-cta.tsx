"use client"

import { useState } from "react"
import { ArrowRight, Globe } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { Reveal } from "./reveal"

export function FinalCta() {
  const [site, setSite] = useState("")

  function start() {
    const value = site.trim()
    if (value) {
      try {
        sessionStorage.setItem("tc:pending-site", value)
      } catch {
        /* private mode — the dashboard just asks again */
      }
    }
    signInWithGoogle()
  }

  return (
    <section className="px-5 py-20 md:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0B0F11] px-6 py-16 text-center md:px-16 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 tc-grain opacity-[0.12]" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(ellipse 70% 70% at 50% 0%, black, transparent)",
              }}
            />
            <div className="absolute left-1/2 top-[-120px] h-[280px] w-[560px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Start indexing</p>
            <h2 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl md:text-[44px]">
              Point it at your site and watch it answer.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-white/60">
              Free plan, no card. If it can&apos;t find the answer in your content, it says so instead of inventing one.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                start()
              }}
              className="mx-auto mt-9 flex max-w-lg flex-col gap-2 rounded-2xl border border-white/12 bg-white/[0.06] p-2 backdrop-blur sm:flex-row sm:items-center sm:rounded-full"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Globe className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  aria-label="Your website URL"
                  placeholder="yourwebsite.com"
                  autoComplete="url"
                  className="h-10 w-full bg-transparent font-mono text-[13.5px] text-white outline-none placeholder:text-white/35"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-sm font-semibold text-[#0B0F11] transition-colors hover:bg-white/90"
              >
                Index my site
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-6 font-mono text-[11px] text-white/40">
              or{" "}
              <a
                href="mailto:sales@turbochat.live"
                className="text-white/70 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
              >
                talk to a human about volume pricing
              </a>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
