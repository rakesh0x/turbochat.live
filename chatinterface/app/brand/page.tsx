import type { Metadata } from 'next';

import { BrandLogo, BrandMark } from '@/components/brand/logo';

/* The specimen sheet. A logo cannot be judged in one size on one ground, so
   this page is the sizes and the grounds it actually has to survive. Not
   linked from anywhere and not indexed — it is a spec, not a page. */
export const metadata: Metadata = {
  title: 'Brand',
  robots: { index: false, follow: false },
};

function Section({
  path,
  title,
  note,
  children,
}: {
  path: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-6">
      <p className="tc-eyebrow">{path}</p>
      <h2 className="tc-heading mt-2">{title}</h2>
      {note ? <p className="tc-body mt-2 max-w-2xl text-muted-foreground">{note}</p> : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}

const SIZES = [16, 20, 24, 32, 48, 64] as const;

function SizeRow({ onPlate = false }: { onPlate?: boolean }) {
  return (
    <div
      className={
        onPlate
          ? 'dark flex flex-wrap items-end gap-8 rounded-xl border border-border bg-background p-7'
          : 'flex flex-wrap items-end gap-8 rounded-xl border border-border bg-card p-7'
      }
    >
      {SIZES.map((s) => (
        <div key={s} className="flex flex-col items-center gap-3">
          <BrandMark style={{ width: s, height: s }} className="size-auto" />
          <span className="tc-eyebrow">{s}</span>
        </div>
      ))}
    </div>
  );
}

/* The construction view: the 24-unit grid the mark is drawn on, so every
   number in components/brand/logo.tsx can be checked by eye. */
function Construction() {
  return (
    <svg viewBox="-1 -1 26 26" className="w-full max-w-[340px]" role="img" aria-label="Construction grid">
      <defs>
        <pattern id="u" width="1" height="1" patternUnits="userSpaceOnUse">
          <path d="M1 0V1H0" fill="none" stroke="var(--border)" strokeWidth="0.04" />
        </pattern>
      </defs>
      <rect width="24" height="24" fill="url(#u)" />
      <rect width="24" height="24" rx="5.4" fill="var(--foreground)" opacity="0.04" />
      <rect width="24" height="24" rx="5.4" fill="none" stroke="var(--border-strong)" strokeWidth="0.1" />
      {/* the margins the drawing actually keeps */}
      <path d="M4 -0.6V24.6" stroke="var(--signal)" strokeWidth="0.08" strokeDasharray="0.5 0.4" />
      <path d="M-0.6 4.6H24.6M-0.6 19.4H24.6" stroke="var(--signal)" strokeWidth="0.08" strokeDasharray="0.5 0.4" />
      <rect x="4" y="4.6" width="12" height="2.4" fill="var(--foreground)" opacity="0.35" />
      <rect x="4" y="10.3" width="20" height="3.4" fill="var(--marker-deep)" />
      <rect x="4" y="17" width="7.5" height="2.4" fill="var(--foreground)" opacity="0.35" />
    </svg>
  );
}

const SPECS: [string, string][] = [
  ['frame', '24 × 24, rx 5.4 — 22.5%'],
  ['left margin', '4'],
  ['vertical margin', '4.6'],
  ['line height', 'page 2.4 · cited 3.4'],
  ['gaps', '3.3'],
  ['line lengths', '12 / 20 / 7.5'],
  ['cited line', 'reaches x = 24 — it leaves the frame'],
  ['cited centre', '12 — the centre of the frame'],
  ['ends', 'square, rx 0'],
];

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="tc-eyebrow">/brand</p>
      <h1 className="tc-display mt-3">The Cited Line</h1>
      <p className="tc-lede mt-4 max-w-2xl text-muted-foreground">
        Two quiet lines of one of your pages, and between them the answer: a marker swipe that
        outruns the paragraph and runs off the right edge of the frame. It read your page, and it
        can point at the line the answer came from.
      </p>

      <div className="mt-12 flex flex-col gap-14">
        <Section
          path="/mark"
          title="The mark"
          note="One mark, framed. There is no unframed version: on paper the marker is lighter than the ink around it, so an unframed cited line goes quiet and the idea dies. The marker needs the ink ground to carry."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid place-items-center rounded-xl border border-border bg-card p-10">
              <BrandMark className="size-[136px]" />
            </div>
            <div className="dark grid place-items-center rounded-xl border border-border bg-background p-10">
              <BrandMark className="size-[136px]" />
            </div>
          </div>
        </Section>

        <Section
          path="/scale"
          title="At size"
          note="The overshoot is a length ratio, not a texture, which is why it is the detail that survives a favicon. At 16px the mark reads as an ink tile with a marker band leaving the right edge — and that is enough to recognise it."
        >
          <div className="flex flex-col gap-4">
            <SizeRow />
            <SizeRow onPlate />
          </div>
        </Section>

        <Section path="/lockup" title="The lockup" note="Inter Tight Medium, -0.03em, lowercase, one colour. The mark's size and the gap are both in em, so the whole lockup scales from a single font-size.">
          <div className="flex flex-col items-start gap-8 rounded-xl border border-border bg-card p-10">
            <BrandLogo className="text-[32px]" />
            <BrandLogo className="text-[20px]" />
            <BrandLogo className="text-[14px]" />
          </div>
        </Section>

        <Section path="/place" title="In place" note="A tab, a nav pill, and an avatar crop — the three places a mark is actually seen.">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-border bg-card p-6">
              {/* browser tab */}
              <div className="flex w-full max-w-sm items-center gap-2 rounded-t-lg border border-border border-b-transparent bg-background px-3 py-2">
                <BrandMark className="size-4" />
                <span className="truncate text-[13px] text-muted-foreground">Turbochat AI</span>
              </div>
              {/* nav pill */}
              <div className="mt-8 flex h-14 items-center justify-between rounded-full border border-border bg-background pl-5 pr-2">
                <BrandLogo />
                <span className="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground">
                  Start free
                </span>
              </div>
            </div>
            <div className="grid place-items-center rounded-xl border border-border bg-card p-6">
              <BrandMark className="size-20 rounded-full [clip-path:circle(50%)]" />
              <span className="tc-eyebrow mt-3">avatar</span>
            </div>
          </div>
        </Section>

        <Section path="/construction" title="Construction" note="Drawn on a 24-unit grid. Teal marks the margins the drawing keeps: flush left at 4, and 4.6 of air above and below — slightly more than at the left, which is what a stack of horizontals needs to sit centred in a square.">
          <div className="grid gap-10 sm:grid-cols-[340px_1fr]">
            <Construction />
            <dl className="flex flex-col gap-3 self-center">
              {SPECS.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-6 border-b border-border pb-2">
                  <dt className="tc-label text-muted-foreground">{k}</dt>
                  <dd className="tc-path text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        <Section path="/rules" title="Rules">
          <ul className="flex flex-col gap-3">
            {[
              'The marker stays the cited line. It is never a button fill, a border, or a second accent on the same row.',
              'The wordmark is one colour. Splitting turbo/chat into two colours is what made the old mark read as a template.',
              'No gradient, no shadow, no bevel. Depth in this product is a hairline and a tonal shift; the mark obeys that too.',
              'Do not close the cited line inside the frame. The bleed is the mark.',
              'Do not round the line ends, and do not even out the weights. The cited line is heavier than the page lines; uniform bars of ragged length are a loading skeleton.',
            ].map((rule) => (
              <li key={rule} className="flex gap-3 border-b border-border pb-3">
                <span aria-hidden="true" className="mt-[0.55em] h-[2px] w-3 shrink-0 bg-marker-deep" />
                <span className="tc-body text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section path="/files" title="Files">
          <dl className="flex flex-col gap-3">
            {[
              ['components/brand/logo.tsx', 'BrandMark, BrandGlyph, BrandWordmark, BrandLogo'],
              ['app/icon.svg', 'favicon, and the source every raster is cut from'],
              ['app/icon.png · app/apple-icon.png', '32 and 180, generated from icon.svg'],
              ['public/brand/', 'mark SVG, plus 512 and 1024 raster for schema.org and social'],
            ].map(([file, what]) => (
              <div key={file} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-2">
                <dt className="tc-path">{file}</dt>
                <dd className="tc-meta text-muted-foreground">{what}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </main>
  );
}
