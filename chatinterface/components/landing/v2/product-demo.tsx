"use client"

import { useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Bot,
  Check,
  Copy,
  Inbox,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Play,
  Rocket,
  Send,
  TrendingUp,
} from "lucide-react"
import { BrandMark } from "./logo"

/* =========================================================================
   Interactive product demo — the Demo section of the landing page.
   --------------------------------------------------------------------------
   A self-contained TurboChat dashboard replica. Four screens the visitor
   can actually click around: Overview, Inbox, Playground, Deploy. No
   backend, no auth — everything is synthetic data that tells the same
   story the real product tells, in the same visual language.

   Design rules followed here:
   · Same tc-* tokens as the console (paper, ink, marker, signal)
   · Marker means exactly one thing: the retrieved passage
   · Mono eyebrows for stage labels, tabular-nums for counts
   · Panels read, tiles scan, rows ledger
   ========================================================================== */

/* ---------- Synthetic data ------------------------------------------------ */

const DEMO_BOT = {
  name: "Acme Support",
  host: "acme.com",
  status: "active",
  pages: 247,
  messages: 1843,
  answerRate: 0.91,
}

const VOLUME_7D = [
  { date: "Aug 16", messages: 61 },
  { date: "Aug 17", messages: 73 },
  { date: "Aug 18", messages: 67 },
  { date: "Aug 19", messages: 84 },
  { date: "Aug 20", messages: 58 },
  { date: "Aug 21", messages: 71 },
  { date: "Aug 22", messages: 93 },
]

const VOLUME_30D = [
  { date: "Jul 24", messages: 18 },
  { date: "Jul 26", messages: 24 },
  { date: "Jul 28", messages: 31 },
  { date: "Jul 30", messages: 27 },
  { date: "Aug 1", messages: 35 },
  { date: "Aug 3", messages: 29 },
  { date: "Aug 5", messages: 42 },
  { date: "Aug 7", messages: 38 },
  { date: "Aug 9", messages: 34 },
  { date: "Aug 11", messages: 38 },
  { date: "Aug 13", messages: 29 },
  { date: "Aug 15", messages: 45 },
  { date: "Aug 17", messages: 73 },
  { date: "Aug 19", messages: 84 },
  { date: "Aug 21", messages: 71 },
  { date: "Aug 22", messages: 93 },
]

type DemoMessage = {
  role: "user" | "assistant"
  content: string
  source?: string
  match?: number
  highlighted?: string
  latencyMs?: number
  grounded?: boolean
}

type DemoConversation = {
  id: string
  opener: string
  messages: number
  lastActive: string
  answered: boolean
  contactEmail: string | null
  transcript: DemoMessage[]
}

const CONVERSATIONS: DemoConversation[] = [
  {
    id: "c1",
    opener: "Do you offer a free trial?",
    messages: 4,
    lastActive: "10 min ago",
    answered: true,
    contactEmail: null,
    transcript: [
      { role: "user", content: "Do you offer a free trial?" },
      {
        role: "assistant",
        content:
          "Yes — every plan starts free, no credit card required. You can train one agent on your docs and embed it on your site today.",
        source: "/pricing",
        match: 0.88,
        highlighted: "every plan starts free",
        latencyMs: 840,
        grounded: true,
      },
      { role: "user", content: "And I can cancel anytime?" },
      {
        role: "assistant",
        content:
          "Exactly. Monthly plans cancel in one click from Plan & usage, and the widget keeps answering until the end of the billing period.",
        source: "/pricing",
        match: 0.81,
        highlighted: "cancel in one click",
        latencyMs: 910,
        grounded: true,
      },
    ],
  },
  {
    id: "c2",
    opener: "How fast can I go live?",
    messages: 2,
    lastActive: "2 hours ago",
    answered: true,
    contactEmail: null,
    transcript: [
      { role: "user", content: "How fast can I go live?" },
      {
        role: "assistant",
        content:
          "About 5 minutes. Paste your URL, we index your content, then you copy a one-line snippet into your site. That's it.",
        source: "/docs/quickstart",
        match: 0.91,
        highlighted: "About 5 minutes",
        latencyMs: 760,
        grounded: true,
      },
    ],
  },
  {
    id: "c3",
    opener: "Can it match our brand colors?",
    messages: 6,
    lastActive: "yesterday",
    answered: true,
    contactEmail: "maya@northwind.co",
    transcript: [
      { role: "user", content: "Can it match our brand colors?" },
      {
        role: "assistant",
        content:
          "Yes. The widget inherits your theme tokens — primary color, radius, and fonts — or you can override each one in Deploy settings.",
        source: "/docs/customization",
        match: 0.93,
        highlighted: "inherits your theme tokens",
        latencyMs: 880,
        grounded: true,
      },
      { role: "user", content: "What about dark mode?" },
      {
        role: "assistant",
        content:
          "Dark mode follows the visitor's system preference automatically, and you can preview both themes before shipping.",
        source: "/docs/customization",
        match: 0.86,
        highlighted: "system preference automatically",
        latencyMs: 790,
        grounded: true,
      },
      { role: "user", content: "Perfect, we'll try it this week." },
      {
        role: "assistant",
        content:
          "Great — start with the Playground to test answers against your own pages, then grab the snippet from Deploy.",
        latencyMs: 640,
        grounded: true,
      },
    ],
  },
  {
    id: "c4",
    opener: "Do you ship to Japan?",
    messages: 3,
    lastActive: "2 days ago",
    answered: false,
    contactEmail: "ken@example.jp",
    transcript: [
      { role: "user", content: "Do you ship to Japan?" },
      {
        role: "assistant",
        content:
          "I couldn't find shipping info in the indexed pages, so I've flagged this for your team. Ken left an email — reply from the inbox and the answer gets added to the knowledge base.",
        latencyMs: 1120,
        grounded: false,
      },
      { role: "user", content: "OK, my email is ken@example.jp" },
      {
        role: "assistant",
        content:
          "Noted — the team has the thread and will follow up. Anything else I can check in the help center meanwhile?",
        latencyMs: 580,
        grounded: false,
      },
    ],
  },
]

const CHATBOT_LIST = [
  { name: "Acme Support", host: "acme.com", status: "active", monthlyMessages: 342, pages: 247 },
  { name: "Docs Bot", host: "docs.acme.com", status: "active", monthlyMessages: 128, pages: 189 },
  { name: "Partner Portal", host: "partners.acme.com", status: "indexing", monthlyMessages: 0, pages: 0 },
]

/* ---------- Playground Q&A ------------------------------------------------ */

const PLAYGROUND_QA = [
  {
    q: "Can I still get a refund after 40 days?",
    a: "You can return anything within 30 days of delivery for a full refund. After that window we issue store credit instead of a cash refund.",
    source: "/help/returns-policy",
    match: 0.94,
    highlighted: "within 30 days of delivery",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — every plan starts free, no credit card required. You can train one agent on your docs and embed it on your site today.",
    source: "/pricing",
    match: 0.88,
    highlighted: "every plan starts free",
  },
  {
    q: "How fast can I go live?",
    a: "About 5 minutes. Paste your URL, we index your content, then you copy a one-line snippet into your site. That's it.",
    source: "/docs/quickstart",
    match: 0.91,
    highlighted: "About 5 minutes",
  },
]

const FALLBACK_ANSWER = {
  a: "I couldn't find that in the indexed pages, so I won't guess. In the real product this escalates to your team with the full transcript attached.",
  source: null as string | null,
  match: null as number | null,
  highlighted: "",
}

/* ---------- Screen type --------------------------------------------------- */

type Screen = "overview" | "inbox" | "playground" | "deploy"

/* ---------- Small presentational pieces ------------------------------------ */

function Dot({ tone }: { tone: "live" | "busy" | "idle" }) {
  if (tone === "live") return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
  if (tone === "busy")
    return <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-foreground/50" />
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-foreground/25" />
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-1.5">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:240ms]" />
    </span>
  )
}

function AnsweredBadge({ answered }: { answered: boolean }) {
  if (answered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/50 px-1.5 py-px text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <span className="h-1 w-1 rounded-full bg-emerald-500" /> answered
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/50 px-1.5 py-px text-[9px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      <span className="h-1 w-1 rounded-full bg-amber-500" /> needs review
    </span>
  )
}

function CitedText({ text, highlighted }: { text: string; highlighted?: string }) {
  if (!highlighted || !text.includes(highlighted)) {
    return <>{text}</>
  }
  const parts = text.split(highlighted)
  return (
    <>
      {parts.map((part, j) => (
        <span key={j}>
          {part}
          {j < parts.length - 1 && (
            <span className="tc-marker" data-lit="true">
              {highlighted}
            </span>
          )}
        </span>
      ))}
    </>
  )
}

/* ---------- Sidebar ------------------------------------------------------- */

const NAV_ITEMS: { id: Screen; label: string; icon: any; path: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/overview" },
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/inbox" },
  { id: "playground", label: "Playground", icon: Play, path: "/answer" },
  { id: "deploy", label: "Deploy", icon: Rocket, path: "/embed" },
]

function Sidebar({
  active,
  onNavigate,
}: {
  active: Screen
  onNavigate: (s: Screen) => void
}) {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-border/60 bg-surface-2/40 md:flex">
      <div className="border-b border-border/60 p-4">
        <div className="mb-2 flex items-center gap-2.5">
          <BrandMark className="h-7 w-7 rounded-[8px]" />
          <span className="font-display text-[15px] font-medium">TurboChat Demo</span>
        </div>
        <div className="tc-path flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <Dot tone="live" />
          <span>{DEMO_BOT.host}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="capitalize">{DEMO_BOT.status}</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                isActive ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              <span className="flex size-5 items-center justify-center">
                <Icon
                  className="h-[15px] w-[15px]"
                  style={{ color: isActive ? "var(--signal)" : "var(--ink-quiet)" }}
                />
              </span>
              <span className="truncate">{item.label}</span>
              <span className="tc-path ml-auto text-[10px] text-muted-foreground/60">{item.path}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-4">
        <div className="tc-path flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>12 / 100 credits</span>
          <span className="text-emerald-600">Free plan</span>
        </div>
      </div>
    </aside>
  )
}

/* ---------- Header -------------------------------------------------------- */

function DemoHeader({ screen }: { screen: Screen }) {
  const labels: Record<Screen, string> = {
    overview: "Overview",
    inbox: "Inbox",
    playground: "Playground",
    deploy: "Deploy",
  }
  const paths: Record<Screen, string> = {
    overview: "/overview",
    inbox: "/inbox",
    playground: "/answer",
    deploy: "/embed",
  }

  return (
    <header className="flex h-13 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-7">
      <span className="tc-eyebrow hidden text-muted-foreground/70 sm:inline">{paths[screen]}</span>
      <span className="tc-title text-foreground">{labels[screen]}</span>
      <span className="ml-auto hidden items-center gap-2 sm:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          <Dot tone="live" /> live demo
        </span>
        <span className="tc-path text-[11px] text-muted-foreground/50">
          {DEMO_BOT.name} · {DEMO_BOT.host}
        </span>
      </span>
    </header>
  )
}

/* ---------- Overview screen ---------------------------------------------- */

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string
  value: string
  note: string
  icon: any
}) {
  return (
    <div className="tc-tile flex flex-col gap-3.5 rounded-xl border border-border/60 p-5">
      <div className="flex items-center justify-between">
        <span className="tc-eyebrow text-muted-foreground/70">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <span className="tc-figure font-display text-[26px] font-medium tabular-nums text-foreground">
        {value}
      </span>
      <span className="tc-path text-[11px] text-muted-foreground/60">{note}</span>
    </div>
  )
}

function AreaChartMini({ data }: { data: { date: string; messages: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.messages))
  const chartH = 80
  const step = 560 / Math.max(data.length - 1, 1)

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${((1 - d.messages / maxVal) * (chartH - 4) + 2).toFixed(1)}`)
    .join(" ")

  return (
    <div className="relative" style={{ height: chartH }}>
      <svg width="100%" height={chartH} viewBox="0 0 560 80" preserveAspectRatio="none" role="img" aria-label="Message volume chart">
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1="0"
            y1={frac * chartH}
            x2="560"
            y2={frac * chartH}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
        <defs>
          <linearGradient id="demo-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L560 80 L0 80 Z`} fill="url(#demo-area)" />
        <path
          d={line}
          fill="none"
          stroke="var(--signal)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

function OverviewScreen({ onOpenInbox }: { onOpenInbox: () => void }) {
  const [range, setRange] = useState<"7d" | "30d">("7d")
  const series = range === "7d" ? VOLUME_7D : VOLUME_30D
  const total = useMemo(() => series.reduce((s, d) => s + d.messages, 0), [series])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="tc-panel rounded-xl border border-border/60 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="tc-eyebrow mb-3 text-muted-foreground/70">/measure</div>
              <h3 className="tc-title text-foreground">Message volume</h3>
            </div>
            <div className="flex rounded-lg border border-border/60 p-0.5 text-[11px] font-medium">
              {(["7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    range === r ? "bg-accent text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  {r === "7d" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="tc-figure font-display text-[28px] font-medium tabular-nums text-foreground">
              {total.toLocaleString()}
            </span>
            <span className="tc-meta text-muted-foreground/60">messages · last {range}</span>
          </div>
          <div className="mt-4">
            <AreaChartMini data={series} />
          </div>
          <div className="tc-path mt-4 flex justify-between text-[11px] text-muted-foreground/50">
            <span>{series[0].date}</span>
            <span>{series[series.length - 1].date}</span>
          </div>
        </div>

        <div className="tc-panel rounded-xl border border-border/60 p-6">
          <div className="tc-eyebrow mb-2 text-muted-foreground/70">/measure</div>
          <h3 className="tc-title text-foreground">Answering well?</h3>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="tc-figure font-display text-[28px] font-medium tabular-nums text-foreground">
              {Math.round(DEMO_BOT.answerRate * 100)}%
            </span>
            <span className="tc-meta text-muted-foreground/60">answer rate</span>
          </div>
          <div
            className="tc-meter mt-4"
            role="progressbar"
            aria-valuenow={Math.round(DEMO_BOT.answerRate * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="tc-meter-bar" style={{ width: `${DEMO_BOT.answerRate * 100}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <span className="tc-path text-[11px] text-muted-foreground/60">Had a source</span>
              <span className="tc-num block font-mono text-[15px] tabular-nums text-foreground">
                {Math.round(DEMO_BOT.messages * DEMO_BOT.answerRate).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="tc-path text-[11px] text-muted-foreground/60">Median reply</span>
              <span className="tc-num block font-mono text-[15px] tabular-nums text-foreground">0.9s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversations · 30d" value="128" note="91% with a cited source" icon={MessageSquare} />
        <StatCard
          label="Chatbots live"
          value={`${CHATBOT_LIST.filter((b) => b.status === "active").length}/${CHATBOT_LIST.length}`}
          note="Partner Portal still indexing"
          icon={Bot}
        />
        <StatCard label="Pages indexed" value={DEMO_BOT.pages.toString()} note="across 8 sources" icon={BookOpen} />
        <StatCard label="Support time saved" value="61 hrs" note="at 4 min per ticket" icon={TrendingUp} />
      </div>

      <div className="tc-panel rounded-xl border border-border/60">
        <div className="flex items-start justify-between px-6 pb-4 pt-5">
          <div>
            <span className="tc-eyebrow text-muted-foreground/70">/inbox</span>
            <h3 className="tc-title mt-1.5 text-foreground">Recent conversations</h3>
          </div>
          <button
            onClick={onOpenInbox}
            className="tc-path text-[11px] text-muted-foreground/60 hover:text-foreground"
          >
            Open inbox →
          </button>
        </div>
        <div className="px-3 pb-3 sm:px-4">
          <div className="grid grid-cols-[minmax(0,1fr)_5rem_4rem] gap-3 px-3 py-2 text-[11px] tc-eyebrow text-muted-foreground/60 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_5rem]">
            <span>Thread</span>
            <span>Bot</span>
            <span className="text-right">Msgs</span>
            <span className="hidden text-right sm:block">Age</span>
          </div>
          {CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={onOpenInbox}
              className="grid w-full grid-cols-[minmax(0,1fr)_5rem_4rem] items-center gap-x-4 gap-y-2 rounded-lg px-3 py-3 text-left text-[13px] transition-colors hover:bg-accent/40 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_5rem]"
            >
              <div className="min-w-0">
                <span className="block truncate font-medium text-foreground">{conv.opener}</span>
                <div className="mt-1 flex flex-wrap gap-x-2">
                  <AnsweredBadge answered={conv.answered} />
                </div>
              </div>
              <span className="tc-path truncate text-[12px] text-muted-foreground/70">{DEMO_BOT.name}</span>
              <span className="tc-num text-right font-mono text-[13px] tabular-nums text-foreground">
                {conv.messages}
              </span>
              <span className="tc-path hidden text-right text-[12px] text-muted-foreground/60 sm:block">
                {conv.lastActive}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Inbox screen ------------------------------------------------- */

type InboxFilter = "all" | "answered" | "needs-review"

function InboxScreen() {
  const [filter, setFilter] = useState<InboxFilter>("all")
  const [selectedId, setSelectedId] = useState(CONVERSATIONS[0].id)

  const filtered = CONVERSATIONS.filter((c) =>
    filter === "all" ? true : filter === "answered" ? c.answered : !c.answered,
  )
  const selected = CONVERSATIONS.find((c) => c.id === selectedId) ?? filtered[0] ?? CONVERSATIONS[0]
  const counts = {
    all: CONVERSATIONS.length,
    answered: CONVERSATIONS.filter((c) => c.answered).length,
    needsReview: CONVERSATIONS.filter((c) => !c.answered).length,
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="tc-panel overflow-hidden rounded-xl border border-border/60">
        <div className="border-b border-border/60 px-4 pb-3 pt-4">
          <span className="tc-eyebrow text-muted-foreground/70">/inbox</span>
          <h3 className="tc-title mt-1 text-foreground">Conversations</h3>
          <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
            {(
              [
                ["all", `All ${counts.all}`],
                ["answered", `Answered ${counts.answered}`],
                ["needs-review", `Needs review ${counts.needsReview}`],
              ] as [InboxFilter, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-1 transition-colors ${
                  filter === f
                    ? "border-border bg-accent text-foreground"
                    : "border-border/60 text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="tc-meta px-3 py-6 text-center text-muted-foreground/60">
              Nothing here — every thread is answered.
            </p>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
                selected.id === conv.id ? "bg-accent/60" : "hover:bg-accent/40"
              }`}
            >
              <span className="block truncate text-[13px] font-medium text-foreground">{conv.opener}</span>
              <span className="mt-1.5 flex items-center gap-2">
                <AnsweredBadge answered={conv.answered} />
                <span className="tc-path text-[11px] text-muted-foreground/50">
                  {conv.messages} msgs · {conv.lastActive}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="tc-panel flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-border/60">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-[14px] font-medium text-foreground">{selected.opener}</h4>
          </div>
          <div className="tc-path mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/60">
            <span>{selected.messages} messages</span>
            <span>{selected.lastActive}</span>
            {selected.contactEmail && <span>{selected.contactEmail}</span>}
            <AnsweredBadge answered={selected.answered} />
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {selected.transcript.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-[13px] leading-snug text-white">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">
                  <BrandMark className="h-6 w-6 rounded-[7px]" />
                </span>
                <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-border/60 bg-background px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-foreground">
                    <CitedText text={m.content} highlighted={m.highlighted} />
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
                    {m.source ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface-2/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">
                          <Link2 className="h-2.5 w-2.5" />
                          {m.source}
                        </span>
                        {m.match != null && (
                          <span className="font-mono text-[10px] text-emerald-600">
                            {m.match.toFixed(2)} match
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-300">
                        no source — escalated
                      </span>
                    )}
                    {m.latencyMs != null && (
                      <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/50">
                        {(m.latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Playground screen -------------------------------------------- */

type PlaygroundEntry = { q: string; a: string; source: string | null; match: number | null; highlighted: string }

function matchQuestion(input: string): PlaygroundEntry & { q: string } {
  const text = input.toLowerCase()
  for (const qa of PLAYGROUND_QA) {
    const keywords = qa.q.toLowerCase().replace(/[?]/g, "").split(/\s+/).filter((w) => w.length > 3)
    if (keywords.some((k) => text.includes(k))) return qa
  }
  if (/(refund|return|trial|price|cost|free|live|fast|long|brand|color|theme|dark)/.test(text)) {
    if (/refund|return/.test(text)) return PLAYGROUND_QA[0]
    if (/trial|price|cost|free/.test(text)) return PLAYGROUND_QA[1]
    return PLAYGROUND_QA[2]
  }
  return { q: input, ...FALLBACK_ANSWER }
}

function PlaygroundScreen() {
  const [history, setHistory] = useState<PlaygroundEntry[]>([])
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function ask(raw: string) {
    const question = raw.trim()
    if (!question || thinking) return
    const entry = matchQuestion(question)
    setInput("")
    setThinking(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setHistory((prev) => [...prev, entry])
      setThinking(false)
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }))
    }, 900)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className="tc-panel flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/60">
      <div className="border-b border-border/60 px-6 py-4">
        <div className="tc-eyebrow text-muted-foreground/70">/answer</div>
        <h3 className="tc-title mt-1 text-foreground">Playground</h3>
        <p className="tc-body mt-1 text-muted-foreground/70">
          Ask the bot something. It can only answer from your own pages — and it cites the one it used.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
        {history.length === 0 && !thinking && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <BrandMark className="h-9 w-9 rounded-[10px]" />
            <p className="tc-body max-w-[280px] text-muted-foreground/70">
              Try a question below — or type your own. Unanswerable questions escalate instead of hallucinating.
            </p>
          </div>
        )}
        <div className="space-y-5">
          {history.map((h, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-[13px] leading-snug text-white">
                  {h.q}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0">
                  <BrandMark className="h-6 w-6 rounded-[7px]" />
                </span>
                <div className="max-w-[82%] rounded-2xl rounded-tl-md border border-border/60 bg-background px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-foreground">
                    <CitedText text={h.a} highlighted={h.highlighted} />
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
                    {h.source ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface-2/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">
                          <Link2 className="h-2.5 w-2.5" />
                          {h.source}
                        </span>
                        {h.match != null && (
                          <span className="font-mono text-[10px] text-emerald-600">
                            {h.match.toFixed(2)} match
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-300">
                        no source — escalated to team
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">
                <BrandMark className="h-6 w-6 rounded-[7px]" />
              </span>
              <div className="rounded-2xl rounded-tl-md border border-border/60 bg-background px-3.5 py-2.5">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PLAYGROUND_QA.map((qa) => (
            <button
              key={qa.q}
              onClick={() => ask(qa.q)}
              disabled={thinking}
              className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground disabled:opacity-40"
            >
              {qa.q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about refunds, pricing, go-live time…"
            aria-label="Ask the demo bot"
            className="w-full flex-1 rounded-xl border border-border/60 bg-surface-2/40 px-3.5 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            aria-label="Send question"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {thinking && (
          <div className="mt-2.5 flex items-center gap-2 font-mono text-[12px] text-muted-foreground/60">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground/60" />
            Retrieving from indexed pages…
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Deploy screen ------------------------------------------------- */

const SNIPPET = `<script src="https://turbochat.live/w.js"></script>
<script>
  TurboChat.init({ id: "acme_live" })
</script>`

function DeployScreen() {
  const [copied, setCopied] = useState(false)
  const [position, setPosition] = useState<"right" | "left">("right")
  const [greeting, setGreeting] = useState("Hi — ask me anything about Acme")

  async function copy() {
    try {
      await navigator.clipboard.writeText(SNIPPET)
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="tc-eyebrow text-muted-foreground/70">/embed</div>
        <h3 className="tc-title mt-1 text-foreground">Deploy to your site</h3>
        <p className="tc-body mt-1 text-muted-foreground/70">One script tag. No rebuild, no redeploy.</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="tc-path text-[11px] text-muted-foreground/60">index.html</span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy snippet"}
          </button>
        </div>
        <pre className="mt-1.5 overflow-x-auto rounded-xl border border-border/60 bg-background px-3.5 py-3 font-mono text-[12px] leading-[1.7] text-foreground">
          {SNIPPET}
        </pre>
      </div>

      <div className="tc-panel rounded-xl border border-border/60 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-foreground">Verified on {DEMO_BOT.host}</p>
            <p className="tc-meta mt-0.5 text-muted-foreground/70">
              Script detected 2 minutes ago · widget responding
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 p-5 sm:grid-cols-2">
        <div>
          <span className="tc-path text-[11px] text-muted-foreground/60">Widget position</span>
          <div className="mt-1.5 flex gap-2" role="radiogroup" aria-label="Widget position">
            {(["right", "left"] as const).map((pos) => (
              <button
                key={pos}
                role="radio"
                aria-checked={position === pos}
                onClick={() => setPosition(pos)}
                className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-[12px] transition-colors ${
                  position === pos
                    ? "border-foreground/25 bg-accent/60 text-foreground"
                    : "border-border/40 text-muted-foreground/60 hover:text-foreground"
                }`}
              >
                {position === pos && <Check className="h-3 w-3 text-emerald-500" />}
                Bottom-{pos}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="demo-greeting" className="tc-path text-[11px] text-muted-foreground/60">
            Greeting
          </label>
          <input
            id="demo-greeting"
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border/60 bg-surface-2/40 px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-foreground/25"
          />
        </div>
      </div>

      <div className="tc-panel overflow-hidden rounded-xl border border-border/60">
        <div className="tc-eyebrow border-b border-border/60 px-5 py-3 text-muted-foreground/70">
          live preview
        </div>
        <div className="relative h-44 bg-surface-2/40">
          <div className="absolute inset-x-4 top-4 space-y-2">
            <div className="h-2.5 w-2/3 rounded bg-foreground/10" />
            <div className="h-2.5 w-1/2 rounded bg-foreground/10" />
            <div className="h-2.5 w-3/5 rounded bg-foreground/10" />
          </div>
          <div className={`absolute bottom-4 ${position === "right" ? "right-4" : "left-4"} flex flex-col items-end gap-2`}>
            <div className="max-w-[220px] rounded-2xl rounded-br-md border border-border/60 bg-background px-3 py-2 text-[12px] text-foreground shadow-lg">
              {greeting || "Hi — ask me anything"}
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg">
              <BrandMark className="h-6 w-6 rounded-full" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Main component ----------------------------------------------- */

export default function ProductDemo() {
  const [screen, setScreen] = useState<Screen>("overview")

  return (
    <div className="demo-shell flex h-[640px] w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background text-left shadow-2xl shadow-black/10 dark:shadow-black/40 md:h-[600px]">
      <DemoHeader screen={screen} />
      {/* Mobile tab bar */}
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 bg-surface-2/40 px-3 py-2 md:hidden" aria-label="Demo sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                isActive ? "bg-accent text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" style={isActive ? { color: "var(--signal)" } : undefined} />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar active={screen} onNavigate={setScreen} />
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-full max-w-[1180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  {screen === "overview" && <OverviewScreen onOpenInbox={() => setScreen("inbox")} />}
                  {screen === "inbox" && <InboxScreen />}
                  {screen === "playground" && <PlaygroundScreen />}
                  {screen === "deploy" && <DeployScreen />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
