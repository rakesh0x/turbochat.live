"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, CornerDownRight, FileText, Globe, Link2, MessageSquare, Search, UserRound } from "lucide-react"
import { BrandMark } from "./logo"

/* ------------------------------------------------------------------ *
 * Scripted product demos, one per pipeline step.
 *
 * Each stage is keyed on activation by the parent, so mounting *is* the
 * trigger — no imperative replay logic. `animate=false` (reduced motion
 * or off-screen) short-circuits every sequence to its final frame, so
 * the panel is still fully legible as a static screenshot.
 * ------------------------------------------------------------------ */

function useSequence(frames: number, step: number, animate: boolean) {
  const [frame, setFrame] = useState(animate ? 0 : frames - 1)

  useEffect(() => {
    if (!animate) {
      setFrame(frames - 1)
      return
    }
    setFrame(0)
    const timers = Array.from({ length: frames - 1 }, (_, i) =>
      setTimeout(() => setFrame(i + 1), step * (i + 1)),
    )
    return () => timers.forEach(clearTimeout)
  }, [frames, step, animate])

  return frame
}

function useStream(text: string, start: boolean, instant: boolean, msPerWord = 44) {
  const words = text.split(" ")
  const total = words.length
  const [n, setN] = useState(0)

  useEffect(() => {
    if (instant) {
      setN(total)
      return
    }
    if (!start) {
      setN(0)
      return
    }
    let i = 0
    setN(0)
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= total) clearInterval(id)
    }, msPerWord)
    return () => clearInterval(id)
  }, [start, instant, text, msPerWord, total])

  return { shown: words.slice(0, n).join(" "), done: n >= total }
}

/* shared bits ------------------------------------------------------ */

function Dot({ tone }: { tone: "live" | "busy" | "idle" }) {
  if (tone === "live") return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
  if (tone === "busy")
    return <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-foreground/50" />
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-foreground/25" />
}

function Meter({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <span className="relative block h-1 w-12 shrink-0 overflow-hidden rounded-full bg-foreground/10">
      <span
        className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
          muted ? "bg-foreground/20" : "bg-violet-500"
        }`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </span>
  )
}

function StageShell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col overflow-hidden">{children}</div>
}

/* 01 — crawl ------------------------------------------------------- */

const SOURCES = [
  { path: "/pricing", kind: "page", chunks: 12 },
  { path: "/docs/quickstart", kind: "page", chunks: 34 },
  { path: "/docs/api/webhooks", kind: "page", chunks: 51 },
  { path: "/help/returns-policy", kind: "page", chunks: 28 },
  { path: "handbook-2026.pdf", kind: "file", chunks: 96 },
  { path: "/changelog", kind: "page", chunks: 19 },
]

export function CrawlStage({ animate }: { animate: boolean }) {
  const frames = SOURCES.length + 2
  const frame = useSequence(frames, 620, animate)
  const done = Math.min(SOURCES.length, Math.max(0, frame - 1))
  const chunks = SOURCES.slice(0, done).reduce((sum, s) => sum + s.chunks, 0)

  return (
    <StageShell>
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background px-3 py-2.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-mono text-[12.5px] text-foreground/85">https://acme.com</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Dot tone={done === SOURCES.length ? "live" : "busy"} />
            {done === SOURCES.length ? "Indexed" : "Crawling"}
          </span>
        </div>
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-foreground/8">
          <span
            className="block h-full rounded-full bg-violet-500 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round((frame / (frames - 1)) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-hidden px-3 py-3">
        {SOURCES.map((src, i) =>
          frame > i ? (
            <div
              key={src.path}
              className="animate-tc-rise flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[12.5px] odd:bg-background/50"
            >
              <Dot tone={frame > i + 1 ? "live" : "busy"} />
              {src.kind === "file" ? (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              )}
              <span className="truncate font-mono text-foreground/85">{src.path}</span>
              <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                {frame > i + 1 ? `${src.chunks} chunks` : "fetching…"}
              </span>
            </div>
          ) : null,
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 bg-background/50">
        {[
          { label: "sources", value: `${done}/${SOURCES.length}` },
          { label: "chunks", value: chunks.toLocaleString() },
          { label: "cost to set up", value: "$0" },
        ].map((cell) => (
          <div key={cell.label} className="px-4 py-3">
            <p className="font-mono text-[15px] tabular-nums text-foreground">{cell.value}</p>
            <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </StageShell>
  )
}

/* 02 — retrieve ---------------------------------------------------- */

const CANDIDATES = [
  { path: "/docs/billing/refunds", score: 0.81 },
  { path: "/help/returns-policy#window", score: 0.94 },
  { path: "/pricing", score: 0.42 },
  { path: "/help/returns-policy#exceptions", score: 0.88 },
  { path: "/changelog", score: 0.31 },
]

const THRESHOLD = 0.75

export function RetrieveStage({ animate }: { animate: boolean }) {
  const frame = useSequence(6, 760, animate)
  const rows = frame >= 2 ? [...CANDIDATES].sort((a, b) => b.score - a.score) : CANDIDATES

  return (
    <StageShell>
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="truncate text-[13.5px] font-medium text-foreground">
          “Can I still get a refund after 40 days?”
        </p>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2.5">
        {rows.map((c, i) => {
          const weak = frame >= 3 && c.score < THRESHOLD
          return (
            <motion.div
              key={c.path}
              layout
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition-opacity duration-500 ${
                frame >= 1 ? "opacity-100" : "opacity-0"
              } ${weak ? "opacity-35" : ""}`}
            >
              <span className="w-3 shrink-0 font-mono text-[10px] text-muted-foreground">
                {frame >= 2 && !weak ? i + 1 : "·"}
              </span>
              <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-mono text-[12px] text-foreground/85">{c.path}</span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <Meter value={frame >= 1 ? c.score : 0} muted={weak} />
                <span className="w-8 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {c.score.toFixed(2)}
                </span>
              </span>
            </motion.div>
          )
        })}
        <p
          className={`mt-1.5 px-2 font-mono text-[10px] text-muted-foreground transition-opacity duration-500 ${
            frame >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          2 chunks below {THRESHOLD.toFixed(2)} threshold — discarded
        </p>
      </div>

      {frame >= 4 ? (
        <div className="animate-tc-rise border-t border-border/60 bg-background/60 px-5 py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            retrieved passage · /help/returns-policy
          </p>
          <p className="text-[13px] leading-relaxed text-foreground/90">
            Standard returns are accepted{" "}
            <span className="tc-marker" data-lit={frame >= 5}>
              within 30 days of delivery
            </span>
            . After 30 days we issue store credit instead of a cash refund.
          </p>
        </div>
      ) : null}
    </StageShell>
  )
}

/* 03 — answer ------------------------------------------------------ */

const GROUNDED = "You can return anything within 30 days of delivery for a full refund. After that window we issue store credit instead."

function Ask({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-tc-rise flex justify-end">
      <p className="max-w-[78%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-[12.5px] leading-snug text-white">
        {children}
      </p>
    </div>
  )
}

function Reply({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-tc-rise flex items-start gap-2">
      <BrandMark className="mt-0.5 h-6 w-6 shrink-0 rounded-[7px]" />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/70 bg-background px-3.5 py-2.5">
        {children}
      </div>
    </div>
  )
}

export function AnswerStage({ animate }: { animate: boolean }) {
  const frame = useSequence(5, 1450, animate)
  const { shown, done } = useStream(GROUNDED, frame >= 1, !animate)

  return (
    <StageShell>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Dot tone="live" />
          grounded mode
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">temperature 0 · cite required</span>
      </div>

      <div className="flex-1 space-y-3.5 overflow-hidden px-4 py-4">
        <Ask>Can I still get a refund after 40 days?</Ask>
        {frame >= 1 ? (
          <Reply>
            <p className="text-[12.5px] leading-relaxed text-foreground">
              {shown}
              {!done ? <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-blink-cursor bg-foreground/70 align-middle" /> : null}
            </p>
            {frame >= 2 ? (
              <div className="animate-tc-rise mt-2.5 flex items-center gap-2 border-t border-border/60 pt-2.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">
                  <Link2 className="h-2.5 w-2.5" />
                  /help/returns-policy
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  0.94 match
                </span>
              </div>
            ) : null}
          </Reply>
        ) : null}

        {frame >= 3 ? <Ask>Do you ship to Japan?</Ask> : null}
        {frame >= 4 ? (
          <Reply>
            <p className="text-[12.5px] leading-relaxed text-foreground">
              I couldn&apos;t find anything about international shipping in your content, so I won&apos;t guess. Want me
              to pass this to the team?
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2 py-1 text-[11px] font-medium text-foreground">
                <UserRound className="h-3 w-3" />
                Talk to a human
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">best match 0.31 — below threshold</span>
            </div>
          </Reply>
        ) : null}
      </div>
    </StageShell>
  )
}

/* 04 — embed ------------------------------------------------------- */

const punct = "text-muted-foreground/70"
const str = "text-violet-600 dark:text-violet-400"

const SNIPPET = [
  <>
    <span className={punct}>{"<script "}</span>
    <span className="text-foreground/90">src</span>
    <span className={punct}>=</span>
    <span className={str}>&quot;https://turbochat.live/w.js&quot;</span>
    <span className={punct}>{"></script>"}</span>
  </>,
  <>
    <span className={punct}>{"<script>"}</span>
  </>,
  <>
    <span className="text-foreground/90">{"  TurboChat"}</span>
    <span className={punct}>.init({"{ "}</span>
    <span className="text-foreground/90">id</span>
    <span className={punct}>: </span>
    <span className={str}>&quot;acme_live&quot;</span>
    <span className={punct}>{" })"}</span>
  </>,
  <>
    <span className={punct}>{"</script>"}</span>
  </>,
]

export function EmbedStage({ animate }: { animate: boolean }) {
  const frame = useSequence(7, 700, animate)
  const lines = Math.min(SNIPPET.length, frame)

  return (
    <StageShell>
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between pb-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">index.html</span>
          {frame >= 5 ? (
            <span className="animate-tc-rise inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              deployed
            </span>
          ) : null}
        </div>
        <pre className="min-h-[86px] overflow-x-auto rounded-xl border border-border/70 bg-background px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] tc-scrollbar-none">
          {SNIPPET.slice(0, lines).map((line, i) => (
            <div key={i} className="animate-tc-rise whitespace-pre">
              {line}
              {i === lines - 1 && lines < SNIPPET.length ? (
                <span className="ml-0.5 inline-block h-3 w-[2px] animate-blink-cursor bg-foreground/70 align-middle" />
              ) : null}
            </div>
          ))}
        </pre>
      </div>

      <div className="relative flex-1 overflow-hidden bg-background/40">
        <div aria-hidden className="pointer-events-none space-y-2.5 px-5 pt-5">
          <div className="flex items-center justify-between">
            <span className="h-2 w-16 rounded-full bg-foreground/15" />
            <span className="flex gap-2.5">
              <span className="h-1.5 w-7 rounded-full bg-foreground/10" />
              <span className="h-1.5 w-7 rounded-full bg-foreground/10" />
              <span className="h-4 w-12 rounded-full bg-foreground/15" />
            </span>
          </div>
          <div className="pt-4">
            <span className="block h-3 w-3/5 rounded-full bg-foreground/15" />
            <span className="mt-2 block h-3 w-2/5 rounded-full bg-foreground/10" />
            <span className="mt-3 block h-1.5 w-1/2 rounded-full bg-foreground/8" />
            <span className="mt-1.5 block h-1.5 w-2/5 rounded-full bg-foreground/8" />
          </div>
        </div>

        {frame >= 6 ? (
          <span className="animate-tc-rise absolute bottom-4 left-5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
            <Dot tone="live" />
            live on acme.com
          </span>
        ) : null}

        {frame >= 6 ? (
          <div className="animate-tc-pop absolute bottom-4 right-5 flex items-end gap-2">
            <span className="mb-1 rounded-2xl rounded-br-md border border-border/70 bg-background px-3 py-1.5 text-[11.5px] text-foreground shadow-sm">
              Hi — ask me anything about Acme
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-lg">
              <MessageSquare className="h-[18px] w-[18px]" />
            </span>
          </div>
        ) : null}
      </div>
    </StageShell>
  )
}
