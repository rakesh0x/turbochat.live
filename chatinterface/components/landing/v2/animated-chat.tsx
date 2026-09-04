"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, FileText, Link2 } from "lucide-react"
import { BrandMark } from "./logo"

type Step = {
  user: string
  answer: string
  sources?: string[]
}

const SCRIPT: Step[] = [
  {
    user: "Do you offer a free trial?",
    answer:
      "Yes — every plan starts free, no credit card required. You can train one agent on your docs and embed it on your site today.",
    sources: ["turbochat.live/pricing"],
  },
  {
    user: "How fast can I go live?",
    answer:
      "About 5 minutes. Paste your URL, we index your content, then you copy a one-line snippet into your site. That's it.",
    sources: ["docs.turbochat.live/quickstart"],
  },
  {
    user: "Can it match our brand?",
    answer:
      "100%. Set your logo, colors, and tone in the design panel and the widget inherits everything automatically.",
  },
]

const suggestions = ["What plans do you have?", "Can it escalate to a human?"]

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-1.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
    </span>
  )
}

export function AnimatedChat() {
  const [items, setItems] = useState<Step[]>([])
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    async function play() {
      while (active) {
        setItems([])
        setTyping(false)
        await sleep(1600)

        for (const step of SCRIPT) {
          if (!active) return
          setItems((prev) => [...prev, step])
          await sleep(1000)
          if (!active) return
          setTyping(true)
          await sleep(1200 + step.answer.length * 10)
          if (!active) return
          setTyping(false)
          await sleep(1500)
        }

        await sleep(3800)
      }
    }

    play()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [items, typing])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7 rounded-[8px]" />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">TurboChat Assistant</p>
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online · answers instantly
            </p>
          </div>
        </div>
        <span className="rounded-full border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          Powered by your docs
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-hidden px-4 py-4">
        {items.map((step, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-[13px] leading-snug text-white">
                {step.user}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="mb-0.5 shrink-0">
                <BrandMark className="h-6 w-6 rounded-[7px]" />
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-bl-md border bg-background px-3.5 py-2.5 shadow-sm">
                <p className="text-[13px] leading-snug text-foreground">{step.answer}</p>
                {step.sources ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {step.sources.map((src) => (
                      <span
                        key={src}
                        className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        {src}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {typing ? (
          <div className="flex items-end gap-2">
            <BrandMark className="mb-0.5 h-6 w-6 rounded-[7px]" />
            <div className="rounded-2xl rounded-bl-md border bg-background px-3.5 py-2 shadow-sm">
              <TypingDots />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {suggestions.map((s) => (
          <span
            key={s}
            className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 focus-within:border-violet-400/60">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <input
            readOnly
            placeholder="Ask about your product…"
            className="h-7 w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
          />
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-white">
            <ArrowUp className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  )
}
