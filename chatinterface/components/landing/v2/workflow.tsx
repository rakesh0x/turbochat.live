"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { SectionHeading } from "./panel"
import { AnswerStage, CrawlStage, EmbedStage, RetrieveStage } from "./workflow-stages"

const STEPS = [
  {
    path: "/crawl",
    title: "Point us at your site",
    problem: "The answers already exist — buried across docs, PDFs and a help centre nobody reads to the end.",
    solution:
      "Paste one URL. TurboChat follows your sitemap, pulls every page and file, and splits them into retrievable chunks.",
    label: "crawl · acme.com",
    dwell: 6200,
    Stage: CrawlStage,
  },
  {
    path: "/retrieve",
    title: "Find the one passage that answers it",
    problem: "Site search hands back forty blue links. The customer asked one question.",
    solution:
      "Each question is embedded and scored against your chunks. Anything under the similarity threshold is discarded rather than guessed from.",
    label: "retrieve · top_k = 3",
    dwell: 7200,
    Stage: RetrieveStage,
  },
  {
    path: "/answer",
    title: "Reply in your words, with a receipt",
    problem: "A confidently wrong answer costs more than no answer at all.",
    solution:
      "Replies are written only from the retrieved passage and cite the page they came from. Nothing above threshold means no answer — it escalates instead.",
    label: "answer · grounded",
    dwell: 8400,
    Stage: AnswerStage,
  },
  {
    path: "/embed",
    title: "Ship it in one line",
    problem: "Support projects stall waiting for engineering time.",
    solution:
      "One script tag — Webflow, WordPress, Next.js, anything. The widget shows up already trained and already on-brand.",
    label: "embed · index.html",
    dwell: 6800,
    Stage: EmbedStage,
  },
]

export function Workflow() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "-15% 0px -15% 0px" })
  const reduce = useReducedMotion()

  const autoplay = inView && !reduce
  const step = STEPS[active]
  const Stage = step.Stage

  return (
    <section id="how-it-works" className="scroll-mt-24 border-y bg-muted/25 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          className="mb-14"
          eyebrow="How it works"
          title="From a URL to answered tickets, in four steps."
          lead="TurboChat is a retrieval pipeline, not a clever prompt. Here is what happens to a real question at every stage."
        />

        <div
          ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14"
        >
          {/* step rail */}
          <ol className="relative">
            {STEPS.map((s, i) => {
              const isActive = i === active
              return (
                <li key={s.path}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    className="group relative block w-full cursor-pointer py-5 pl-6 text-left"
                  >
                    <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-border" />
                    {isActive && autoplay ? (
                      <span
                        key={`fill-${active}`}
                        aria-hidden
                        className="absolute left-0 top-0 h-full w-px origin-top bg-foreground"
                        style={{
                          animation: `tc-progress-y ${s.dwell}ms linear forwards`,
                          animationPlayState: hovered ? "paused" : "running",
                        }}
                        onAnimationEnd={() => setActive((v) => (v + 1) % STEPS.length)}
                      />
                    ) : null}
                    {isActive && !autoplay ? (
                      <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-foreground" />
                    ) : null}

                    <div className="flex items-baseline gap-3">
                      <span
                        className={`font-mono text-[11px] tracking-[0.06em] transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground/70"
                        }`}
                      >
                        {s.path}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/50">
                        0{i + 1}
                      </span>
                    </div>

                    <h3
                      className={`mt-1.5 text-[19px] font-semibold leading-snug tracking-[-0.015em] transition-colors md:text-[21px] ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground/80"
                      }`}
                    >
                      {s.title}
                    </h3>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          key="detail"
                          initial={reduce ? undefined : { height: 0, opacity: 0 }}
                          animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 text-[13.5px] font-medium leading-relaxed text-foreground/70">
                            {s.problem}
                          </p>
                          <p className="pt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.solution}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* stage */}
          <div className="tc-raise overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="flex items-center gap-3 border-b border-border/70 bg-background/50 px-4 py-2.5">
              <span className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
                <span className="h-2 w-2 rounded-full bg-foreground/15" />
              </span>
              <span className="font-mono text-[10.5px] text-muted-foreground">{step.label}</span>
              <span className="ml-auto font-mono text-[10.5px] tabular-nums text-muted-foreground/60">
                step {active + 1} / {STEPS.length}
              </span>
            </div>
            <div className="h-[404px] sm:h-[452px]">
              <Stage key={active} animate={!reduce && inView} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
