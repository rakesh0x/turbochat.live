import { Reveal } from "./reveal";
import { SectionHeading } from "./panel";
import { InsightCards } from "./insight-cards";

/* ------------------------------------------------------------------ *
 * What the index gives back once the widget is live. The right column
 * is a real fragment of the dashboard rather than an illustration, so
 * it gets the same frame the feature cards use: raised card, mono
 * label bar, recessed body.
 * ------------------------------------------------------------------ */

const READS = [
  { path: "/answer-rate", copy: "Which sources are trusted, and which are going stale." },
  { path: "/volume", copy: "Which days broke the pattern, and what changed that day." },
  { path: "/citations", copy: "Which page every answer leans on — and what to write next." },
];

export function Insights() {
  return (
    <section id="insights" className="scroll-mt-24 border-t py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Insights"
              title="Every answered question tells you something about your docs."
              lead="The index that answers your customers keeps score while it works. No dashboards to wire up — the reading is already there when you log in."
            />

            <ul className="relative mt-10 max-w-xl">
              {READS.map((read, i) => (
                <Reveal key={read.path} delay={0.06 * i}>
                  <li className="relative py-4 pl-6">
                    <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-border" />
                    <span className="font-mono text-[11px] tracking-[0.06em] text-foreground">
                      {read.path}
                    </span>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                      {read.copy}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal delay={0.1} className="mx-auto w-full max-w-[380px] lg:mx-0">
            <div className="tc-raise overflow-hidden rounded-2xl border border-border/70 bg-card">
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  dashboard · insights
                </span>
                <span className="flex gap-1">
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                  <span className="h-1 w-1 rounded-full bg-foreground/20" />
                </span>
              </div>
              <div className="tc-well bg-muted/60 p-4">
                <InsightCards />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
