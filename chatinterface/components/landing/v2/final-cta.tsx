"use client"

import { ArrowRight } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import { Reveal } from "./reveal"

export function FinalCta() {
  return (
    <section className="px-5 py-20 md:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 px-6 py-16 text-center md:px-16 md:py-24">
          {/* texture + glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 tc-grain opacity-[0.15]" />
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl" />
            <div className="absolute inset-0 tc-bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to put your support on autopilot?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-violet-100">
              Train your first agent on your docs and see it answer real questions — free, no credit card, live in
              minutes.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => signInWithGoogle()}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-transform hover:scale-[1.02]"
                style={{ height: 52 }}
              >
                Start free — build your agent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="mailto:sales@turbochat.live"
                className="inline-flex h-[52px] items-center gap-2 rounded-full border border-white/30 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Talk to sales
              </a>
            </div>
            <p className="mt-6 text-xs text-violet-200/80">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
