"use client"

import { Globe, Lock } from "lucide-react"
import { AnimatedChat } from "./animated-chat"

function FakeSite() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* fake site nav */}
      <div className="flex items-center justify-between px-8 pt-7">
        <div className="h-2.5 w-24 rounded-full bg-foreground/15" />
        <div className="hidden items-center gap-4 sm:flex">
          <div className="h-2 w-10 rounded-full bg-foreground/10" />
          <div className="h-2 w-10 rounded-full bg-foreground/10" />
          <div className="h-2 w-10 rounded-full bg-foreground/10" />
          <div className="h-5 w-16 rounded-full bg-foreground/15" />
        </div>
      </div>

      {/* fake hero headline */}
      <div className="mt-10 flex flex-col gap-3 px-8">
        <div className="h-5 w-3/4 max-w-sm rounded-full bg-foreground/15" />
        <div className="h-5 w-1/2 max-w-xs rounded-full bg-foreground/10" />
        <div className="mt-2 h-2.5 w-2/3 max-w-md rounded-full bg-foreground/8" />
        <div className="h-2.5 w-3/5 max-w-sm rounded-full bg-foreground/8" />
        <div className="mt-3 flex gap-3">
          <div className="h-8 w-28 rounded-full bg-foreground/15" />
          <div className="h-8 w-28 rounded-full bg-foreground/8" />
        </div>
      </div>

      {/* fake content cards */}
      <div className="mt-10 grid grid-cols-3 gap-4 px-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-5">
            <div className="h-8 w-8 rounded-lg bg-foreground/10" />
            <div className="h-2.5 w-4/5 rounded-full bg-foreground/12" />
            <div className="h-2 w-full rounded-full bg-foreground/8" />
            <div className="h-2 w-2/3 rounded-full bg-foreground/8" />
          </div>
        ))}
      </div>

      {/* soft overlay so the widget pops */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
    </div>
  )
}

export function ProductMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      {/* ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -inset-y-8 rounded-[48px] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-indigo-500/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span className="font-mono">app.turbochat.live</span>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Lock className="h-3 w-3" />
            <span>Secure</span>
          </div>
        </div>

        {/* body */}
        <div className="relative h-[480px] bg-background sm:h-[520px]">
          <FakeSite />

          {/* live chat widget */}
          <div className="absolute bottom-0 right-0 w-[min(352px,calc(100%-2rem))] p-4 sm:bottom-4 sm:right-4 sm:p-0">
            <div className="h-[420px] sm:h-[440px]">
              <AnimatedChat />
            </div>
          </div>

          {/* floating launch bubble */}
          <div className="absolute bottom-5 left-5 hidden items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live on yourwebsite.com
          </div>
        </div>
      </div>
    </div>
  )
}
