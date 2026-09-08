'use client';

import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import { CheckOutlined, CopyAiOutlined } from '@lineiconshq/free-icons';
import { cn } from '@/lib/utils';

/* ==========================================================================
   The dashboard kit
   --------------------------------------------------------------------------
   Every product view composes from this file. That is the whole point: a
   dashboard stops feeling like a template the moment its screens share a
   *skeleton* — same header rhythm, same panel edge, same figure scale, same
   empty state — and it starts feeling like a template again the moment each
   screen invents its own.

   Rules encoded here so no screen has to remember them:
     · One page header per view, one primary action inside it.
     · Panels for things people read, tiles for things people scan.
     · Figures use the display face at optical size 72 and tabular numerals.
     · A missing number is an em dash, never a stand-in zero.
     · The marker (yellow) means "this is the cited passage" — nothing else.
     · The plate (ink gradient) means commerce, at most once per screen.
   ========================================================================== */

type Icon = ComponentType<{ className?: string }> | any;

/** A number a response really carried. Zero is an answer; missing is not. */
export function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Exact, grouped, or an em dash. Use where the precise figure is the point. */
export function exact(value: unknown): string {
  const parsed = num(value);
  return parsed === null ? '—' : parsed.toLocaleString();
}

/** Abbreviated for tiles: 1.2K, 3.4M. Never rounds a number under 10,000. */
export function compact(value: unknown): string {
  const parsed = num(value);
  if (parsed === null) return '—';
  if (Math.abs(parsed) >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)}M`;
  if (Math.abs(parsed) >= 10_000) return `${(parsed / 1_000).toFixed(1)}K`;
  return parsed.toLocaleString();
}

/** `visitors` / `1 visitor` without a stray "(s)" anywhere in the interface. */
export function plural(count: number, one: string, many?: string): string {
  return count === 1 ? one : many ?? `${one}s`;
}

/* --------------------------------------------------------------------------
   Page header
   The mono eyebrow names the pipeline stage the screen belongs to (`/crawl`,
   `/index`, `/answer`, `/embed`, `/billing`) on a hairline rail, which is how
   a reader knows where they are without a breadcrumb.
   -------------------------------------------------------------------------- */

/** A chatbot's domain. Two bots called "Docs" are told apart by their host,
    never by their name, so anywhere a name appears the host earns its place. */
export function hostOf(bot: any): string {
  const raw = String(bot?.website_url ?? bot?.websiteUrl ?? bot?.url ?? '');
  if (!raw) return '';
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).host.replace(/^www\./, '');
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/** Monogram for an avatar or a plate. Never more than two characters, because
    a third turns a monogram back into text that is too small to read. */
export function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** A row of mono facts: counts, hosts, timestamps. */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-4', className)}>
      <header className="min-w-0 max-w-2xl">
        <p className="tc-eyebrow">{eyebrow}</p>
        <h1 className="tc-display tc-display-md mt-2.5 text-foreground">{title}</h1>
        {description ? (
          <p className="tc-lede mt-3 text-muted-foreground">{description}</p>
        ) : null}
        {meta ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">{meta}</div>
        ) : null}
      </header>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** One mono fact for a header's `meta` row or a panel footer. */
export function Fact({
  label,
  value,
  tone = 'quiet',
}: {
  label: string;
  value: ReactNode;
  tone?: 'quiet' | 'signal';
}) {
  return (
    <span className="tc-path text-muted-foreground">
      {label}{' '}
      <span className={cn('tc-num', tone === 'signal' ? 'text-signal' : 'text-foreground')}>
        {value}
      </span>
    </span>
  );
}

/* --------------------------------------------------------------------------
   Surfaces
   -------------------------------------------------------------------------- */

export function Panel({
  className,
  children,
  interactive = false,
  ...rest
}: React.ComponentProps<'section'> & { interactive?: boolean }) {
  return (
    <section
      data-slot="panel"
      className={cn('tc-panel', interactive && 'tc-lift', className)}
      {...rest}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-6 pt-5 pb-4 sm:px-7',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="tc-eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="tc-heading text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="tc-body mt-1.5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PanelBody({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('px-6 pb-6 sm:px-7', className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelFooter({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-surface-2/60 px-6 py-3.5 sm:px-7',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A rule that fades at both ends, for separating rows inside a panel. */
export function Hairline({ className }: { className?: string }) {
  return <hr className={cn('tc-hairline', className)} />;
}

/* --------------------------------------------------------------------------
   Figures
   -------------------------------------------------------------------------- */

export function StatGrid({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export type Delta = { percent: number; rising: boolean; note?: string };

/** The tile is the unit of scanning: a label, one figure, one line beneath. */
export function StatTile({
  label,
  value,
  unit,
  note,
  delta,
  icon,
  href,
  meter,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  delta?: Delta | null;
  icon?: Icon;
  href?: string;
  meter?: { pct: number; level?: 'ok' | 'low' | 'empty' };
  className?: string;
  children?: ReactNode;
}) {
  const Wrapper: any = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={cn(
        'tc-tile flex flex-col gap-3.5 p-5',
        href && 'tc-lift cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="tc-eyebrow">{label}</p>
        {icon ? (
          <Lineicons
            icon={icon}
            size={15}
            className="shrink-0 text-muted-foreground"
            aria-hidden="true"
            focusable="false"
          />
        ) : null}
      </div>

      <p className="tc-figure tc-figure-lg text-foreground">
        {value}
        {unit ? (
          <span className="ml-1 font-sans text-base font-medium tracking-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>

      {meter ? (
        <div
          className="tc-meter"
          data-level={meter.level ?? 'ok'}
          style={{ ['--tc-fill' as any]: `${Math.max(0, Math.min(100, meter.pct))}%` }}
        >
          <span className="tc-meter-bar" />
        </div>
      ) : null}

      {delta || note ? (
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta ? <DeltaChip delta={delta} /> : null}
          {note ? <span className="tc-path text-muted-foreground">{note}</span> : null}
        </div>
      ) : null}

      {children}
    </Wrapper>
  );
}

/* A direction, drawn in reserved status hues only where direction genuinely
   means better or worse. Callers that measure something neutral (questions
   asked) pass `tone="neutral"` and get muted ink instead. */
export function DeltaChip({
  delta,
  tone = 'quality',
}: {
  delta: Delta;
  tone?: 'quality' | 'neutral';
}) {
  const good = delta.rising;
  const cls =
    tone === 'neutral'
      ? 'border-border bg-muted text-muted-foreground'
      : good
        ? 'border-success-border bg-success-soft text-success-ink'
        : 'border-warning-border bg-warning-soft text-warning';

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={cn(
          'tc-micro inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
          cls,
        )}
      >
        <span aria-hidden="true">{good ? '↑' : '↓'}</span>
        <span className="tc-num">
          {good ? '+' : ''}
          {delta.percent}%
        </span>
      </span>
      {delta.note ? <span className="tc-path text-muted-foreground">{delta.note}</span> : null}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Rows
   -------------------------------------------------------------------------- */

/** A ledger row: hairline-separated, hover-lit, never a boxed card in a list. */
export function Row({ className, children, ...rest }: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        'group grid gap-x-4 gap-y-2 border-t border-border px-3.5 py-4 transition-colors first:border-t-0 hover:bg-accent/60',
        className,
      )}
      {...rest}
    >
      {children}
    </li>
  );
}

export function RowList({ className, children, ...rest }: React.ComponentProps<'ul'>) {
  return (
    <ul className={cn('-mx-2', className)} {...rest}>
      {children}
    </ul>
  );
}

/* --------------------------------------------------------------------------
   Empty and loading
   -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  secondary,
  className,
}: {
  icon: Icon;
  title: string;
  body: string;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'tc-dotfield flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center',
        className,
      )}
    >
      <span className="tc-tile flex size-11 items-center justify-center rounded-xl">
        <Lineicons
          icon={icon}
          size={20}
          className="text-muted-foreground"
          aria-hidden="true"
          focusable="false"
        />
      </span>
      <div className="space-y-1.5">
        <p className="tc-heading text-foreground">
          {title}
        </p>
        <p className="tc-body mx-auto max-w-md text-muted-foreground">{body}</p>
      </div>
      {action || secondary ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

/** Loading that holds the real layout, so nothing jumps when data lands. */
export function Bone({ className }: { className?: string }) {
  return <span className={cn('tc-shimmer block rounded-md bg-surface-2', className)} />;
}

export function TileSkeleton() {
  return (
    <div className="tc-tile flex flex-col gap-3 p-5">
      <Bone className="h-2.5 w-24" />
      <Bone className="h-8 w-20" />
      <Bone className="h-2.5 w-32" />
    </div>
  );
}

export function PanelSkeleton({ bodyHeight = 'h-64' }: { bodyHeight?: string }) {
  return (
    <div className="tc-panel">
      <div className="space-y-2 px-6 pt-5 pb-4 sm:px-7">
        <Bone className="h-3.5 w-40" />
        <Bone className="h-2.5 w-56" />
      </div>
      <div className="px-6 pb-6 sm:px-7">
        <Bone className={cn('w-full', bodyHeight)} />
      </div>
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Bone key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Small parts
   -------------------------------------------------------------------------- */

/** A host, a path, an id — the product's raw material, always monospaced. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('tc-path text-foreground', className)}>{children}</span>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="tc-title text-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Something is happening on the server right now. */
export function LiveTag({ label = 'Live' }: { label?: string }) {
  return (
    <span className="tc-micro inline-flex items-center gap-1.5 rounded-full border border-signal-border bg-signal-soft px-2 py-0.5 text-signal-ink">
      <span aria-hidden="true" className="tc-live-dot" />
      {label}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Toolbars, lists, and the controls above them
   -------------------------------------------------------------------------- */

/** The row above a list: what you are looking at on the left, controls right. */
export function Toolbar({
  children,
  className,
  count,
}: {
  children?: ReactNode;
  className?: string;
  /** Left-hand summary, e.g. `4 chatbots`. Mono, because it is a count. */
  count?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-3',
        className,
      )}
    >
      {count ? <p className="tc-path text-muted-foreground">{count}</p> : <span />}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Column headings for a RowList. Mono and quiet: they are not content. */
export function RowHead({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('tc-eyebrow -mx-2 grid gap-x-4 px-3.5 pb-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** One control that holds several views, for switching what a panel shows. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'default',
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  size?: 'sm' | 'default';
}) {
  return (
    <div
      role="tablist"
      className={cn('tc-inset inline-flex items-center gap-0.5 p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-[0.8125rem]' : 'h-8 px-3 text-sm',
              active
                ? 'border border-border bg-card text-foreground'
                : 'border border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Status
   -------------------------------------------------------------------------- */

type StatusTone = 'live' | 'working' | 'failed' | 'idle';

function statusTone(status: unknown): StatusTone {
  const raw = String(status ?? '').toLowerCase();
  if (raw === 'active' || raw === 'live' || raw === 'ready') return 'live';
  if (raw === 'training' || raw === 'crawling' || raw === 'indexing' || raw === 'pending')
    return 'working';
  if (raw === 'error' || raw === 'failed') return 'failed';
  return 'idle';
}

/** A bot's state, in reserved hues, with a word — never colour alone. */
export function StatusPill({ status, className }: { status: unknown; className?: string }) {
  const tone = statusTone(status);
  const label = String(status ?? 'unknown').toLowerCase();

  const skin: Record<StatusTone, string> = {
    live: 'border-success-border bg-success-soft text-success-ink',
    working: 'border-signal-border bg-signal-soft text-signal-ink',
    failed: 'border-danger-border bg-danger-soft text-danger',
    idle: 'border-border bg-surface-2 text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'tc-micro inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 capitalize',
        skin[tone],
        className,
      )}
    >
      {tone === 'working' ? (
        <span aria-hidden="true" className="tc-live-dot" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 rounded-full',
            tone === 'live' ? 'bg-success' : tone === 'failed' ? 'bg-danger' : 'bg-muted-foreground',
          )}
        />
      )}
      {label}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Forms
   Settings screens are where dashboards usually fall apart: every section
   invents its own width, so nothing lines up down the page. `FormSection`
   fixes the rhythm — explanation on the left, controls on the right, one
   column width for every section in the product.
   -------------------------------------------------------------------------- */

export function FormSection({
  title,
  description,
  children,
  footer,
  tone = 'default',
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** `danger` for the one section that destroys something. */
  tone?: 'default' | 'danger';
  className?: string;
}) {
  const danger = tone === 'danger';

  return (
    <section
      className={cn(
        'tc-panel',
        danger && 'border-danger-border bg-danger-soft/40',
        className,
      )}
    >
      <div className="grid gap-x-10 gap-y-6 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2
            className={cn(
              'tc-heading',
              danger ? 'text-danger' : 'text-foreground',
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="tc-body mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-border bg-surface-2/60 px-6 py-3.5 sm:px-7">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/** Label, control, and the one line of help that stops a support ticket. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="tc-label text-foreground"
        >
          {label}
        </label>
        {optional ? <span className="tc-path text-muted-foreground">optional</span> : null}
      </div>
      {children}
      {error ? (
        <p className="tc-meta text-danger">{error}</p>
      ) : hint ? (
        <p className="tc-meta text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** A row of switch-style settings, hairline separated, label beside control. */
export function ToggleRow({
  title,
  description,
  control,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-t border-border pt-4.5 first:border-t-0 first:pt-0',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="tc-label text-foreground">{title}</p>
        {description ? (
          <p className="tc-meta mt-1 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   The states nobody designs until launch week
   -------------------------------------------------------------------------- */

/** A request failed. Say which one, and give the reader the retry. */
export function ErrorState({
  title = 'Could not load this',
  body,
  onRetry,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3.5 rounded-lg border border-danger-border bg-danger-soft/40 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-danger-border bg-card">
        <span aria-hidden="true" className="font-mono text-sm text-danger">
          !
        </span>
      </span>
      <div className="space-y-1.5">
        <p className="tc-heading text-foreground">
          {title}
        </p>
        <p className="tc-body mx-auto max-w-sm text-muted-foreground">
          {body ?? 'The request did not come back. Nothing was changed.'}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="tc-path rounded-md border border-border bg-card px-2.5 py-1.5 text-foreground transition-colors hover:border-border-strong hover:bg-accent"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

/* An integration we have not built. It is drawn as a real tile at reduced
   contrast rather than hidden, because the honest answer to "can it read our
   Notion?" is "not yet, and here is where it will appear" — and because the
   grid it lives in should not reflow the day it ships. */
export function FutureTile({
  icon,
  name,
  note,
  status = 'Planned',
  className,
}: {
  icon: Icon;
  name: string;
  note?: string;
  status?: string;
  className?: string;
}) {
  return (
    <div
      aria-disabled="true"
      className={cn(
        'tc-tile flex items-start gap-3.5 border-dashed p-4.5 opacity-70',
        className,
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
        <Lineicons
          icon={icon}
          size={15}
          className="text-muted-foreground"
          aria-hidden="true"
          focusable="false"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="tc-label text-foreground">{name}</p>
          <span className="tc-path rounded-full border border-border bg-surface-2 px-1.5 py-px text-muted-foreground">
            {status}
          </span>
        </div>
        {note ? (
          <p className="tc-meta mt-1 text-muted-foreground">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Facts in two columns: label left, value right, hairline between. */
export function KeyValue({
  items,
  className,
}: {
  items: { label: string; value: ReactNode; mono?: boolean }[];
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="tc-meta shrink-0 text-muted-foreground">
            {item.label}
          </dt>
          <dd
            className={cn(
              'tc-meta min-w-0 truncate text-right text-foreground',
              item.mono !== false ? 'tc-path text-foreground' : 'font-medium',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A keyboard hint. Small, mono, and never bigger than the text beside it. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="tc-micro rounded border border-border bg-surface-2 px-1.5 py-px text-muted-foreground">
      {children}
    </kbd>
  );
}

/* --------------------------------------------------------------------------
   Copy
   The product hands people three things to paste: a script tag, a share link,
   an API key. Each one is a mono value that must be copyable in one click and
   must not wrap into something a reader could mis-transcribe.
   -------------------------------------------------------------------------- */

export function CopyField({
  value,
  label,
  multiline = false,
  className,
}: {
  value: string;
  label?: string;
  /** Snippets keep their line breaks; links stay on one line. */
  multiline?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* Clipboard refused (insecure origin, denied permission). The value is
         selectable on screen, so the reader is not stuck. */
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="tc-eyebrow">{label}</p> : null}
      <div className="tc-inset relative">
        <pre
          className={cn(
            'tc-path overflow-x-auto px-4 py-3.5 pr-24 text-foreground',
            multiline ? 'whitespace-pre' : 'whitespace-nowrap',
          )}
        >
          {value}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="tc-micro absolute right-2 top-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-foreground transition-colors hover:border-border-strong hover:bg-accent"
        >
          <Lineicons
            icon={copied ? CheckOutlined : CopyAiOutlined}
            size={12}
            aria-hidden="true"
            focusable="false"
          />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
