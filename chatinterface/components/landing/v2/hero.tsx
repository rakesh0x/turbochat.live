"use client"

import { useState } from "react"
import { ArrowRight, Globe } from "lucide-react"
import { signInWithGoogle } from "@/lib/auth"
import ProductDemo from "./product-demo"

export function Hero() {
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
    <section className="relative overflow-hidden pb-16 pt-32 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 tc-bg-grid [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-violet-300/25 blur-[150px] dark:bg-violet-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#how-it-works"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-muted-foreground backdrop-blur transition-colors hover:border-foreground/25 hover:text-foreground"
          >
            crawl → retrieve → answer → embed
            <ArrowRight className="h-3 w-3" />
          </a>

          <h1 className="font-display text-[38px] font-medium leading-[1.05] tracking-[-0.032em] sm:text-[52px] md:text-[64px]">
            Customer support
            <br className="hidden sm:block" /> that{" "}
            <span className="tc-marker" data-lit="true">
              shows its sources
            </span>
            .
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-lg">
            TurboChat reads your website, docs and PDFs, then answers customers using only what it found — and links the
            page it used. One script tag, live in about five minutes.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              start()
            }}
            className="mx-auto mt-9 flex max-w-xl flex-col items-center gap-3"
          >
            <div className="tc-raise flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-card p-2 sm:flex-row sm:items-center sm:rounded-full">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  aria-label="Your website URL"
                  placeholder="yourwebsite.com"
                  autoComplete="url"
                  className="h-10 w-full bg-transparent font-mono text-[13.5px] outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <button
                type="submit"
                className="group inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Index my site
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              free plan · no card · every answer cites a page or escalates
            </p>
          </form>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden
            className="absolute -inset-x-8 -inset-y-6 rounded-[48px] bg-violet-500/10 blur-3xl dark:bg-violet-500/15"
          />
          <div className="relative">
            <ProductDemo />
          </div>
          <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
            live demo — click around, no account needed
          </p>
        </div>
      </div>
    </section>
  )
}
