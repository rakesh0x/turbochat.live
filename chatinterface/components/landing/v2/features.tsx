"use client"

import { useEffect, useState } from "react"
import { Check, Globe2, LineChart, RefreshCw, ShieldHalf, Users } from "lucide-react"
import { Card, CardBody, SectionHeading, Stage, useStageSequence } from "./panel"

/* ------------------------------------------------------------------ *
 * Every card ends in a fragment of product UI that plays a short,
 * self-explaining workflow the first time it scrolls past. Two of them
 * (languages, guardrails) are hand-drivable — the toggle genuinely
 * changes what the sample reply says, because that *is* the feature.
 * ------------------------------------------------------------------ */

const GAPS = [
  { q: "Do you ship to Japan?", asked: 41, missing: true },
  { q: "How do I cancel mid-cycle?", asked: 28, missing: false },
  { q: "Is there a Zapier integration?", asked: 17, missing: true },
]

function GapsCard() {
  const { ref, frame } = useStageSequence(GAPS.length + 2, 460)

  return (
    <Card className="md:col-span-3" delay={0}>
      <CardBody eyebrow="Content gaps" icon={<LineChart />} title="It tells you what your docs are missing">
        Every question it had to refuse becomes a ranked list of pages nobody has written yet. Ticket volume turns into
        a documentation backlog, in priority order.
      </CardBody>
      <Stage stageRef={ref} label="unanswered · last 7 days">
        <div className="min-h-[128px] divide-y divide-border/50">
          {GAPS.map((g, i) =>
            frame > i ? (
              <div key={g.q} className="animate-tc-rise flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/85">{g.q}</span>
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  ×{g.asked}
                </span>
                <span className="w-[74px] shrink-0 text-right">
                  {frame > i + 1 ? (
                    <span
                      className={`animate-tc-rise inline-block rounded-md px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] ${
                        g.missing ? "bg-foreground/10 text-foreground/75" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {g.missing ? "no source" : "thin"}
                    </span>
                  ) : null}
                </span>
              </div>
            ) : null,
          )}
        </div>
        <div className="border-t border-border/50 px-4 py-2.5">
          <span
            className={`block font-mono text-[10.5px] text-muted-foreground transition-opacity duration-500 ${
              frame >= GAPS.length + 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            86 questions · 11 with no source → write these first
          </span>
        </div>
      </Stage>
    </Card>
  )
}

function HandoffCard() {
  const { ref, frame } = useStageSequence(4, 700)

  return (
    <Card className="md:col-span-3" delay={0.06}>
      <CardBody eyebrow="Escalation" icon={<Users />} title="Hands off before a customer gets stuck">
        When nothing scores high enough — or someone just wants a person — the whole thread lands in Slack with the
        sources it checked. Your teammate reads context, not a cold “hi”.
      </CardBody>
      <Stage stageRef={ref} label="handoff · #support">
        <div className="min-h-[152px] space-y-2 px-4 py-3.5">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">“Do you ship to Japan?”</span>
            <span className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full bg-foreground/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-foreground/35 transition-[width] duration-700 ease-out"
                style={{ width: frame >= 1 ? "31%" : "88%" }}
              />
            </span>
            <span className="w-7 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {frame >= 1 ? "0.31" : "—"}
            </span>
          </div>

          {frame >= 1 ? (
            <p className="animate-tc-rise pl-1 font-mono text-[10.5px] text-muted-foreground">
              below 0.75 threshold → escalate
            </p>
          ) : null}

          {frame >= 2 ? (
            <div className="animate-tc-rise rounded-lg border border-border/60 bg-background px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-foreground/8 font-mono text-[9px] font-semibold text-foreground/70">
                  MK
                </span>
                <span className="text-[12px] font-medium text-foreground">Assigned to Maya</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">12s</span>
              </div>
              {frame >= 3 ? (
                <p className="animate-tc-rise mt-2 flex items-center gap-1.5 border-t border-border/50 pt-2 font-mono text-[10.5px] text-muted-foreground">
                  <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  4-turn transcript + retrieval log attached
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Stage>
    </Card>
  )
}

const LANGS = [
  { code: "EN", label: "English", line: "Returns are accepted within 30 days of delivery." },
  { code: "ES", label: "Español", line: "Aceptamos devoluciones dentro de los 30 días posteriores a la entrega." },
  { code: "JA", label: "日本語", line: "配送から30日以内であれば、返品を承っております。" },
]

function LanguagesCard() {
  const [i, setI] = useState(0)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (held) return
    const id = setInterval(() => setI((v) => (v + 1) % LANGS.length), 2600)
    return () => clearInterval(id)
  }, [held])

  return (
    <Card className="md:col-span-2" delay={0}>
      <CardBody eyebrow="Languages" icon={<Globe2 />} title="One source, every language">
        Write the policy once. It replies in whatever language the customer typed, from the exact same indexed passage.
      </CardBody>
      <Stage>
        <div className="px-4 py-3.5">
          <div className="flex gap-1.5">
            {LANGS.map((l, n) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setI(n)
                  setHeld(true)
                }}
                aria-pressed={n === i}
                className={`cursor-pointer rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  n === i
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.code}
              </button>
            ))}
          </div>
          <p key={i} className="animate-tc-rise mt-3 min-h-[52px] text-[12.5px] leading-relaxed text-foreground/85">
            {LANGS[i].line}
          </p>
          <p className="flex items-center gap-1.5 border-t border-border/50 pt-2.5 font-mono text-[10px] text-muted-foreground">
            <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
            same source · /help/returns-policy
          </p>
        </div>
      </Stage>
    </Card>
  )
}

function FreshnessCard() {
  const { ref, frame } = useStageSequence(4, 640)

  return (
    <Card className="md:col-span-2" delay={0.06}>
      <CardBody eyebrow="Freshness" icon={<RefreshCw />} title="Never answers from last quarter">
        TurboChat re-crawls on a schedule and re-embeds only what actually changed, so a pricing edit reaches the widget
        without anyone remembering to retrain it.
      </CardBody>
      <Stage stageRef={ref}>
        <div className="min-h-[124px] space-y-2 px-4 py-3.5">
          <div className="flex items-center justify-between font-mono text-[10.5px]">
            <span className="text-muted-foreground">re-crawl</span>
            <span className="text-foreground/80">daily · 04:00 UTC</span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-foreground/8">
            <span
              className="block h-full rounded-full bg-foreground/40 transition-[width] duration-[900ms] ease-out"
              style={{ width: frame >= 1 ? "100%" : "8%" }}
            />
          </div>
          {frame >= 2 ? (
            <div className="animate-tc-rise rounded-lg border border-border/60 bg-background px-2.5 py-2">
              <p className="font-mono text-[11px] text-foreground/85">/pricing</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">+4</span> chunks ·{" "}
                <span className="text-foreground/70">−1</span> stale
                {frame >= 3 ? <span className="text-foreground/70"> · re-embedded 2m ago</span> : null}
              </p>
            </div>
          ) : null}
          <p className="font-mono text-[10.5px] text-muted-foreground">
            {frame >= 2 ? "141 pages unchanged · skipped" : "scanning 142 pages…"}
          </p>
        </div>
      </Stage>
    </Card>
  )
}

function GuardrailsCard() {
  const [grounded, setGrounded] = useState(true)

  return (
    <Card className="md:col-span-2" delay={0.12}>
      <CardBody eyebrow="Guardrails" icon={<ShieldHalf />} title="Decide what it will not say">
        Keep it inside your own content, and off anything a human should own. Flip the rule below to see what the other
        kind of chatbot does with a question it has no source for.
      </CardBody>
      <Stage>
        <div className="px-4 py-3.5">
          <button
            type="button"
            role="switch"
            aria-checked={grounded}
            onClick={() => setGrounded((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-2.5 text-left"
          >
            <span
              className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                grounded ? "bg-foreground" : "bg-foreground/20"
              }`}
            >
              <span
                className="absolute top-0.5 h-3 w-3 rounded-full bg-background transition-transform duration-200"
                style={{ transform: grounded ? "translateX(15px)" : "translateX(3px)" }}
              />
            </span>
            <span className="font-mono text-[11px] text-foreground/85">answer only from my content</span>
          </button>

          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="mb-2 text-[11.5px] text-muted-foreground">“Do you ship to Japan?”</p>
            <p key={String(grounded)} className="animate-tc-rise text-[12.5px] leading-relaxed text-foreground/85">
              {grounded
                ? "I couldn’t find anything about international shipping in your content — want me to pass this to the team?"
                : "Yes, we ship worldwide with 5–7 day delivery and free returns."}
            </p>
            <p
              className={`mt-2 font-mono text-[10px] ${
                grounded ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              }`}
            >
              {grounded ? "no source → escalated to a human" : "invented · no source in your content"}
            </p>
          </div>
        </div>
      </Stage>
    </Card>
  )
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          className="mb-14"
          eyebrow="Built for support"
          title="The five things that decide whether a customer leaves happy."
          lead="No agent studio, no flow builder, no per-seat licence. Just the parts of support software you open every day."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          <GapsCard />
          <HandoffCard />
          <LanguagesCard />
          <FreshnessCard />
          <GuardrailsCard />
        </div>
      </div>
    </section>
  )
}
