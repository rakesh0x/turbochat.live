"use client"

import {
  BarChart3,
  Code2,
  FileText,
  Globe,
  Link2,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Reveal } from "./reveal"

function Card({
  className = "",
  icon,
  iconClass = "",
  title,
  description,
  children,
  delay = 0,
}: {
  className?: string
  icon: React.ReactNode
  iconClass?: string
  title: string
  description: string
  children?: React.ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/60 hover:shadow-[0_20px_60px_-20px_rgba(124,58,237,0.25)] dark:hover:border-violet-500/40">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass ?? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"}`}
          >
            {icon}
          </span>
          <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-auto">{children}</div>
      </div>
    </Reveal>
  )
}

const sources = [
  { name: "docs.yourco.com", type: "Website", status: "Indexed", width: "w-full" },
  { name: "support-playbook.pdf", type: "PDF", status: "Indexed", width: "w-4/5" },
  { name: "help-center.notion.site", type: "Notion", status: "Indexed", width: "w-[88%]" },
  { name: "api-reference.md", type: "Markdown", status: "Syncing…", width: "w-2/3" },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Features
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Everything you need to ship an AI support agent.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No engineers required. No model tuning. No black box — every answer is grounded in your content.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          {/* Train on anything */}
          <Card
            className="md:col-span-4"
            icon={<Globe className="h-5 w-5" />}
            title="Train on anything"
            description="Paste a URL, upload PDFs, or connect your help center. TurboChat crawls, chunks, and indexes it all into a knowledge base your agent can actually cite."
            delay={0}
          >
            <div className="space-y-2">
              {sources.map((src) => (
                <div
                  key={src.name}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground/90">{src.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">{src.type}</span>
                    <span
                      className={`flex items-center gap-1.5 font-medium ${
                        src.status === "Indexed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          src.status === "Indexed" ? "bg-emerald-500" : "animate-pulse bg-amber-500"
                        }`}
                      />
                      {src.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Grounded answers */}
          <Card
            className="md:col-span-2"
            icon={<ShieldCheck className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            title="Grounded, cited answers"
            description="RAG pulls from your real content — no hallucinations, every reply traceable to a source."
            delay={0.08}
          >
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-xs leading-relaxed text-foreground/85">
                “Our refund window is <span className="font-semibold">30 days</span> from delivery…”
              </p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Link2 className="h-2.5 w-2.5" />
                Source: /returns-policy
              </span>
            </div>
          </Card>

          {/* Brand voice */}
          <Card
            className="md:col-span-2"
            icon={<Palette className="h-5 w-5" />}
            iconClass="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400"
            title="Your brand, your voice"
            description="Logo, colors, assistant name, and tone — the widget looks native to your product."
            delay={0.04}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                  Y
                </span>
                <span className="text-sm font-semibold">Yuna · your assistant</span>
              </div>
              <div className="flex gap-1.5">
                {["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"].map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border-2 border-card shadow-sm" style={{ background: c }} />
                ))}
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Casual</span>
                  <span>Professional</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-muted">
                  <span className="absolute left-[38%] h-3.5 w-3.5 -translate-y-[30%] rounded-full border-2 border-white bg-violet-600 shadow" />
                </div>
              </div>
            </div>
          </Card>

          {/* Embed */}
          <Card
            className="md:col-span-4"
            icon={<Code2 className="h-5 w-5" />}
            iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
            title="Embed in one line"
            description="Copy one snippet into your site — React, Webflow, WordPress, anything. The chat bubble shows up already trained and on-brand."
            delay={0.12}
          >
            <div className="overflow-hidden rounded-xl border bg-muted/40">
              <div className="flex items-center gap-1.5 border-b bg-background/60 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-[10px] text-muted-foreground">index.html</span>
              </div>
              <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed">
                <code>
                  <span className="text-muted-foreground">{"<script"}</span> <span className="text-violet-600 dark:text-violet-400">src</span>
                  <span className="text-muted-foreground">=</span><span className="text-emerald-600 dark:text-emerald-400">"https://turbochat.live/widget.js"</span>
                  <span className="text-muted-foreground">{"></script>"}</span>
                  {"\n"}
                  <span className="text-muted-foreground">{"<script>"}</span>
                  <span className="text-foreground">ChatbotWidget</span>
                  <span className="text-muted-foreground">.init({"{ chatbotId: "}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">"xyz-123"</span>
                  <span className="text-muted-foreground">{" })"}</span>
                  <span className="text-muted-foreground">{"</script>"}</span>
                </code>
              </pre>
            </div>
          </Card>

          {/* Analytics */}
          <Card
            className="md:col-span-3"
            icon={<BarChart3 className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            title="See every conversation"
            description="Track resolution rate, spot gaps in your docs, and know exactly what customers keep asking."
            delay={0.08}
          >
            <div className="flex h-28 items-end gap-2">
              {[42, 58, 40, 66, 78, 52, 88, 70, 94, 60, 82, 100].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600/20 to-violet-500 transition-all duration-300 hover:to-violet-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Mon</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">▲ 92% resolved</span>
            </div>
          </Card>

          {/* Human handoff */}
          <Card
            className="md:col-span-3"
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
            title="Human handoff, one click"
            description="When a customer needs a real person, the agent hands the full transcript to your team in Slack or email."
            delay={0.12}
          >
            <div className="space-y-2">
              <div className="rounded-xl border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground/85">Escalate to a teammate</p>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                    Live
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Full context + transcript included — no one has to re-ask.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-[9px] font-bold text-white">
                  MK
                </span>
                Assigned to Maya · support@yourco.com
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
