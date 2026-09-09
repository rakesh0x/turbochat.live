"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { FileText, TrendingUp } from "lucide-react";
import { Liveline, type LivelinePoint, type LivelineSeries } from "liveline";

/* ------------------------------------------------------------------ *
 * INSIGHT CARDS
 *
 * A fragment of the TurboChat dashboard, dropped on the landing page:
 * three embedded mini-visualisations in an "Insights 1/3 ‹ ›" carousel —
 * answer rate by source, an unusual-volume day, and which pages the
 * answers actually cite. Autoplay pauses on hover and yields for good
 * the moment someone clicks, so nobody fights the timer.
 *
 * Chrome stays monochrome per the page's card rules. Only the data
 * carries colour, and only three: violet for the product's own line,
 * emerald for a number moving the right way, rose for one that isn't.
 * ------------------------------------------------------------------ */

const EASE = [0.16, 1, 0.3, 1] as const;
const EASE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
const AUTOPLAY_MS = 7200;

type Tone = "up" | "down" | "brand";

/* canvas wants literal hex, so both themes are spelled out and kept in
 * step with the Tailwind classes below */
const HEX = {
  light: { up: "#059669", down: "#e11d48", brand: "#7c3aed" },
  dark: { up: "#34d399", down: "#fb7185", brand: "#a78bfa" },
} as const;

const TONE_TEXT: Record<Tone, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  brand: "text-violet-600 dark:text-violet-400",
};

const TONE_DOT: Record<Tone, string> = {
  up: "bg-emerald-500",
  down: "bg-rose-500",
  brand: "bg-violet-500",
};

const hex = (tone: Tone, dark: boolean) => HEX[dark ? "dark" : "light"][tone];

const formatPercent = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const formatCount = (v: number) => Math.round(v).toLocaleString("en-US");
/* a typical day — the median shrugs off the very spike we are pointing at,
 * so the baseline stays honest without hand-picking which days to average */
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/* anchor the snapshot to *call* time (inside each card's mount-time memo) —
 * a module-load constant goes stale, and once the points age past the chart
 * window the canvas renders empty */
function makePoints(values: number[], gap = 6): LivelinePoint[] {
  const end = Math.floor(Date.now() / 1000);
  return values.map((value, index) => ({
    time: end - (values.length - 1 - index) * gap,
    value,
  }));
}

/* Catmull-Rom resample — turn a sparse series into a dense, smoothly curved
 * one so both the line and the hover cursor glide instead of stepping between
 * a handful of points. */
function smooth(values: number[], perSegment = 9): number[] {
  if (values.length < 3) return values.slice();
  const out: number[] = [];
  const n = values.length;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(n - 1, i + 2)];
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        0.5 *
          (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3),
      );
    }
  }
  out.push(values[n - 1]);
  return out;
}

/* dense, smoothed points spanning exactly `spanSecs` — keeps the chart window
 * unchanged while multiplying the resolution. */
function smoothPoints(values: number[], spanSecs: number): LivelinePoint[] {
  const dense = smooth(values);
  return makePoints(dense, spanSecs / (dense.length - 1));
}

/* the canvas is painted, not styled, so it needs the theme as a value */
function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/* inline @mention of a crawled source */
function Entity({ name, tone = "brand" }: { name: string; tone?: Tone }) {
  return (
    <span className="inline-flex items-center gap-1 align-baseline font-medium text-foreground">
      <span className={`inline-block size-2.5 rounded-full ${TONE_DOT[tone]}`} />
      @{name}
    </span>
  );
}

function Mono({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <code className={`font-mono text-[11.5px] ${TONE_TEXT[tone]}`}>{children}</code>;
}

function chartIndexFromPointer(event: React.PointerEvent<HTMLDivElement>, pointCount: number) {
  const rect = event.currentTarget.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  return Math.round(progress * (pointCount - 1));
}

function ChartTooltip({ rows }: { rows: { label: string; value: string; color: string }[] }) {
  return (
    <div className="tc-insight-tip">
      {rows.map((row) => (
        <span key={row.label} className="tc-insight-tip-item">
          <span className="tc-insight-tip-dot" style={{ background: row.color }} />
          {row.value}
        </span>
      ))}
    </div>
  );
}

/* content shape for the answer-rate card's two plotted sources */
export type CompareSeries = {
  /** crawled source, rendered as an @mention */
  name: string;
  /** signed % change per day, oldest first — the last point is the headline */
  values: number[];
  /** mono sub-label under the headline number */
  sub: string;
  tone: Exclude<Tone, "brand">;
};

const COMPARE_SERIES: CompareSeries[] = [
  {
    name: "changelog",
    values: [-0.4, -1.1, -0.8, -2.0, -1.7, -2.9, -3.5, -4.4],
    sub: "112 refusals",
    tone: "down",
  },
  {
    name: "docs",
    values: [0.6, 1.5, 1.2, 2.7, 2.3, 4.2, 5.3, 6.2],
    sub: "1,894 answers",
    tone: "up",
  },
];

/* 1 — answer rate by source: 2 series, legend + big deltas + line chart */
function CompareCard({ series = COMPARE_SERIES }: { series?: CompareSeries[] }) {
  const dark = useDarkMode();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const points = useMemo(() => series.map((s) => smoothPoints(s.values, 42)), [series]);
  const pointCount = points[0]?.length ?? 0;

  const chartSeries: LivelineSeries[] = useMemo(
    () =>
      series.map((s, i) => ({
        id: s.name,
        label: "",
        data: points[i],
        value: points[i].at(-1)?.value ?? (s.values.at(-1) ?? 0),
        color: hex(s.tone, dark),
      })),
    [series, points, dark],
  );

  return (
    <div className="tc-raise min-h-[278px] rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex items-center gap-4">
        {series.map((s, i) => (
          <div key={s.name} className="flex-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className={`size-2 rounded-full ${TONE_DOT[s.tone]}`} />
              @{s.name}
            </span>
            <span
              className={`block text-[17px] font-semibold tracking-[-0.01em] tabular-nums ${TONE_TEXT[s.tone]}`}
            >
              {formatPercent(points[i].at(-1)?.value ?? (s.values.at(-1) ?? 0))}
            </span>
            <Mono tone={s.tone}>{s.sub}</Mono>
          </div>
        ))}
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
        <div className="flex items-center justify-between border-b border-border/60 px-2.5 py-1.5">
          <span className="font-mono text-[10.5px] text-muted-foreground">answer rate · 7d</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
            sample
          </span>
        </div>
        <div
          className="tc-insight-stage relative h-[166px]"
          onPointerDown={(event) => setHoverIndex(chartIndexFromPointer(event, pointCount))}
          onPointerMove={(event) => setHoverIndex(chartIndexFromPointer(event, pointCount))}
          onPointerLeave={() => setHoverIndex(null)}
          onPointerCancel={() => setHoverIndex(null)}
          onPointerUp={() => setHoverIndex(null)}
        >
          <Liveline
            data={[]}
            value={0}
            series={chartSeries}
            theme={dark ? "dark" : "light"}
            grid={false}
            pulse={false}
            window={42}
            paused
            badge={false}
            scrub={false}
            cursor="default"
            lineWidth={2.25}
            padding={{ top: 16, right: 0, bottom: 22, left: 0 }}
            formatValue={formatPercent}
          />
          {hoverIndex !== null && (
            <>
              <span
                className="tc-insight-cursor"
                style={{ left: `${(hoverIndex / (pointCount - 1)) * 100}%` }}
              />
              <span
                className="tc-insight-tip-anchor"
                style={{
                  left: `${Math.min(Math.max((hoverIndex / (pointCount - 1)) * 100, 28), 72)}%`,
                }}
              >
                <ChartTooltip
                  rows={series.map((s, i) => ({
                    label: s.name,
                    value: formatPercent(points[i][hoverIndex].value),
                    color: hex(s.tone, dark),
                  }))}
                />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* content shape for the anomaly card's two toggled metrics */
export type AnomalyData = {
  questions: number[];
  escalations: number[];
};

const ANOMALY_DATA: AnomalyData = {
  questions: [274, 289, 264, 307, 331, 1210, 1718, 2112],
  escalations: [18, 19, 17, 21, 22, 58, 81, 96],
};

const METRICS = [
  { key: "questions", label: "Questions", noun: "questions" },
  { key: "escalations", label: "Escalated", noun: "escalations" },
] as const;

type Metric = (typeof METRICS)[number]["key"];

/* 2 — unusual volume: line + typical-day reference, toggled by metric */
function AnomalyCard({ data = ANOMALY_DATA }: { data?: AnomalyData }) {
  const dark = useDarkMode();
  const [metric, setMetric] = useState<Metric>("questions");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const questions = useMemo(() => makePoints(data.questions, 7), [data]);
  const escalations = useMemo(() => makePoints(data.escalations, 7), [data]);

  const points = metric === "questions" ? questions : escalations;
  const value = points.at(-1)?.value ?? 0;
  const baseline = median(points.map((point) => point.value));
  const noun = METRICS.find((m) => m.key === metric)!.noun;

  return (
    <div className="tc-raise min-h-[278px] rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
          <TrendingUp className="size-3.5 text-rose-600 dark:text-rose-400" />
          Unusual question volume
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
          Mar 14
        </span>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
        <div className="flex items-center justify-between border-b border-border/60 px-2.5 py-1.5">
          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {hoverIndex !== null
              ? `${formatCount(points[hoverIndex].value)} ${noun}`
              : `${formatCount(baseline)} / day typical`}
          </span>
          <span className="flex rounded-full bg-muted p-0.5">
            {METRICS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={metric === item.key}
                onClick={() => setMetric(item.key)}
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96] ${
                  metric === item.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </span>
        </div>
        <div
          className="tc-insight-stage relative h-[166px]"
          onPointerDown={(event) => setHoverIndex(chartIndexFromPointer(event, points.length))}
          onPointerMove={(event) => setHoverIndex(chartIndexFromPointer(event, points.length))}
          onPointerLeave={() => setHoverIndex(null)}
          onPointerCancel={() => setHoverIndex(null)}
          onPointerUp={() => setHoverIndex(null)}
        >
          <Liveline
            data={points}
            value={value}
            theme={dark ? "dark" : "light"}
            color={hex("down", dark)}
            grid
            scrub={false}
            fill={false}
            pulse={false}
            momentum={false}
            paused
            badge={false}
            window={49}
            lineWidth={2.25}
            cursor="crosshair"
            referenceLine={{ value: baseline, label: "typical" }}
            padding={{ top: 20, right: 0, bottom: 22, left: 0 }}
            formatValue={formatCount}
          />
          {hoverIndex !== null && (
            <>
              <span
                className="tc-insight-cursor"
                style={{ left: `${(hoverIndex / (points.length - 1)) * 100}%` }}
              />
              <span
                className="tc-insight-tip-anchor"
                style={{
                  left: `${Math.min(Math.max((hoverIndex / (points.length - 1)) * 100, 28), 72)}%`,
                }}
              >
                <ChartTooltip
                  rows={[
                    {
                      label: metric,
                      value: `${formatCount(points[hoverIndex].value)} ${noun}`,
                      color: hex("down", dark),
                    },
                  ]}
                />
              </span>
            </>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[17px] font-semibold tracking-[-0.01em] tabular-nums text-foreground">
          {formatCount(value)} {noun}
        </span>
        <Mono tone="down">+{formatCount(value - baseline)}</Mono>
        <span className="text-[11px] text-muted-foreground">vs typical</span>
      </div>
    </div>
  );
}

/* content shape for one cited page */
export type AllocationSegment = {
  /** page path, shown in mono */
  path: string;
  /** short label for the legend chip */
  short: string;
  pct: number;
  citations: number;
  /** bar + dot colour — violet for the dominant page, neutral steps below it */
  bar: string;
  /** one line about this page, shown in the well */
  note: string;
};

const ALLOCATION_SEGMENTS: AllocationSegment[] = [
  {
    path: "/docs/billing",
    short: "billing",
    pct: 72.5,
    citations: 1842,
    bar: "bg-violet-500",
    note: "Nearly three in four answers end up here. Splitting it into task-sized pages would spread confidence across the long tail.",
  },
  {
    path: "/faq",
    short: "faq",
    pct: 22.8,
    citations: 579,
    bar: "bg-foreground/35",
    note: "Short entries, high hit rate — the cheapest page you own. Worth extending before writing anything new.",
  },
  {
    path: "/changelog",
    short: "changelog",
    pct: 4.7,
    citations: 119,
    bar: "bg-foreground/15",
    note: "Barely cited since the last crawl. Stale pages score below threshold and get skipped rather than guessed from.",
  },
];

/* 3 — citations by page: hero number + segmented bar + legend */
function AllocationCard({ segments = ALLOCATION_SEGMENTS }: { segments?: AllocationSegment[] }) {
  const [selected, setSelected] = useState(segments[0].path);
  const active = segments.find((segment) => segment.path === selected) ?? segments[0];

  return (
    <div className="tc-raise flex min-h-[278px] flex-col rounded-2xl border border-border/70 bg-card p-3">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
        <FileText className="size-3.5 text-muted-foreground" />
        Citations by page
      </span>
      <span className="mt-1 block text-[20px] font-semibold tracking-[-0.01em] tabular-nums text-foreground">
        {formatCount(active.citations)}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {active.path} · {active.pct}% of answers
      </span>
      <div
        className="mt-3 flex h-9 gap-0.5 overflow-hidden rounded-full bg-muted p-0.5"
        role="group"
        aria-label="Cited pages"
      >
        {segments.map((s) => (
          <button
            key={s.path}
            type="button"
            aria-pressed={selected === s.path}
            aria-label={`${s.path}: ${s.pct}% of answers`}
            onClick={() => setSelected(s.path)}
            className={`h-full min-w-0 rounded-full ${s.bar} transition-[opacity,transform,box-shadow] duration-300 active:scale-[0.98]`}
            style={{
              flex: `${s.pct} 1 0%`,
              opacity: selected === s.path ? 1 : 0.5,
              boxShadow: selected === s.path ? "inset 0 0 0 1px rgba(255,255,255,0.3)" : undefined,
              transitionTimingFunction: EASE_CSS,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {segments.map((s) => (
          <button
            key={s.path}
            type="button"
            aria-pressed={selected === s.path}
            onClick={() => setSelected(s.path)}
            className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
              selected === s.path
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className={`size-1.5 rounded-full ${s.bar}`} />
            {s.short} <span className="tabular-nums">{s.pct}%</span>
          </button>
        ))}
      </div>
      <div className="tc-well mt-3 flex-1 rounded-xl border border-border/60 bg-muted/40 px-2.5 py-2">
        <span className="block font-mono text-[11px] text-foreground">{active.path}</span>
        <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
          {active.note}
        </span>
      </div>
    </div>
  );
}

/* content shape for one page of the carousel */
export type InsightPage = {
  key: string;
  prose: React.ReactNode;
  Card: React.ComponentType;
  /** the follow-up the dashboard offers next — a still, not a live control */
  pill: string;
};

const PAGES: InsightPage[] = [
  {
    key: "answer-rate",
    prose: (
      <>
        Answer rate on <Entity name="changelog" tone="down" /> slid <Mono tone="down">-4.4%</Mono>{" "}
        since the last crawl, while <Entity name="docs" tone="up" /> climbed{" "}
        <Mono tone="up">+6.2%</Mono>.
      </>
    ),
    Card: CompareCard,
    pill: "Which changelog pages went stale?",
  },
  {
    key: "volume",
    prose: (
      <>
        Question volume spiked on <span className="font-medium text-foreground">Mar 14</span> —{" "}
        <Mono tone="down">+1,793</Mono> above a typical day, almost all about the new plan.
      </>
    ),
    Card: AnomalyCard,
    pill: "What were people asking that day?",
  },
  {
    key: "citations",
    prose: (
      <>
        Almost every answer leans on one page — <Mono tone="brand">/docs/billing</Mono> carries{" "}
        <span className="font-medium text-foreground">72.5%</span> of citations.
      </>
    ),
    Card: AllocationCard,
    pill: "How should I split that page?",
  },
];

export type InsightCardsLabels = {
  /** carousel heading shown before the page counter */
  title: string;
};

const DEFAULT_INSIGHT_LABELS: InsightCardsLabels = {
  title: "Insights",
};

export function InsightCards({
  pages = PAGES,
  labels,
}: {
  pages?: InsightPage[];
  labels?: Partial<InsightCardsLabels>;
} = {}) {
  const l = { ...DEFAULT_INSIGHT_LABELS, ...labels };
  const [page, setPage] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const reduce = useReducedMotion();

  /* advance on its own only while nobody is reading a card and nobody has
   * touched the pager yet */
  useEffect(() => {
    if (engaged || hovered || reduce || !inView || pages.length < 2) return;
    const timer = window.setInterval(
      () => setPage((current) => (current + 1) % pages.length),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [engaged, hovered, reduce, inView, pages.length]);

  const move = (direction: -1 | 1) => {
    setEngaged(true);
    setPage((current) => (current + direction + pages.length) % pages.length);
  };

  const { key, prose, Card, pill } = pages[page];

  const body = (
    <>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{prose}</p>
      <div className="mt-2">
        <Card />
      </div>
      <span className="mt-2 inline-block rounded-full border border-border/70 bg-card px-3 py-1.5 text-left text-[12px] text-foreground">
        {pill}
      </span>
    </>
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label={l.title}
      onPointerDown={() => setEngaged(true)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setEngaged(true)}
      className="min-h-[408px] w-full max-w-[344px]"
    >
      {/* pager header */}
      <div className="flex items-center justify-between">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">{l.title}</span>
          <span
            className="font-mono text-[12px] tabular-nums text-muted-foreground"
            aria-label={`Insight ${page + 1} of ${pages.length}`}
          >
            {page + 1}/{pages.length}
          </span>
        </span>
        <span className="flex items-center gap-0.5">
          {(["M15 18l-6-6 6-6", "M9 6l6 6-6 6"] as const).map((d, i) => (
            <button
              key={d}
              type="button"
              aria-label={i === 0 ? "Previous insight" : "Next insight"}
              onClick={() => move(i === 0 ? -1 : 1)}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-100 hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={d} />
              </svg>
            </button>
          ))}
        </span>
      </div>

      {/* page content — blurred crossfade */}
      {reduce ? (
        <div>{body}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={key}
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
