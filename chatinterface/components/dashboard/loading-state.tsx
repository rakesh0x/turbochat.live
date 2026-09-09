'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   Waiting
   --------------------------------------------------------------------------
   A 3×3 grid of pixels, a label that sweeps, and a running clock. Three
   choices are the whole design:

   · A wavefront, not a spinner. A spinner says "something is happening"; a
     front that crosses the grid every 650ms — shorter than its own sweep, so
     two are always in flight — says it is still happening *now*. That is the
     one question a reader has after four seconds.

   · The clock counts in tenths. A wait with no number attached is where
     customers reload; a wait that says 4.8s is a wait they will sit through.
     It is `tabular-nums` so the digits do not jitter, and `aria-hidden` so a
     screen reader is told "Churning" once instead of ten times a second.

   · The animation is a class, not a style block. `.tc-pixel` reads
     `--pixel-dur` and `--pixel-delay` off each cell, so a pattern is data —
     a list of delays — and `prefers-reduced-motion` freezes all of them from
     one rule in globals.css while the clock keeps ticking.
   ========================================================================== */

export type LoaderVariant = 'Drive' | 'Dots' | 'Orbit' | 'Surfer';

type Pattern = { delays: (number | null)[]; dur: number; round: boolean };

/* Delay rises with the column and with distance from the middle row, which is
   what makes the lit cells a chevron rather than a straight bar. */
const chevron = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return (col + Math.abs(row - 1)) * 90;
});

/* Perimeter, clockwise from the top left. The centre cell is `null`: a comet
   lapping the edge has nothing to say about the middle. */
const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const DRIVE: Pattern = { delays: chevron, dur: 650, round: false };
const DOTS: Pattern = { delays: chevron, dur: 650, round: true };
const ORBIT: Pattern = { delays: orbit, dur: 950, round: false };

function patternFor(variant: LoaderVariant): Pattern {
  if (variant === 'Dots') return DOTS;
  if (variant === 'Orbit') return ORBIT;
  return DRIVE;
}

function LoaderGrid({ delays, dur, round }: Pattern) {
  return (
    <span aria-hidden="true" className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, index) => (
        <span
          key={index}
          className={cn(
            'size-[4px] bg-foreground',
            round ? 'rounded-full' : 'rounded-[1px]',
            delay === null ? null : 'tc-pixel',
          )}
          style={
            delay === null
              ? { opacity: 0.07 }
              : ({ opacity: 0.15, '--pixel-dur': `${dur}ms`, '--pixel-delay': `${delay}ms` } as any)
          }
        />
      ))}
    </span>
  );
}

/** Tenths, because a wait measured in whole seconds looks stalled between them. */
function useElapsed() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicks((current) => current + 1), 100);
    return () => clearInterval(timer);
  }, []);

  const total = ticks / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export function LoadingState({
  label,
  variant = 'Drive',
  /* The meme feed for the Surfer variant, on Vercel Blob so it plays in
     production — the local public/subway-surfers.mp4 stays gitignored. */
  videoSrc = 'https://95dnc2a95qgwt9ff.public.blob.vercel-storage.com/subway-surfers.mp4',
  className,
}: {
  label?: string;
  variant?: LoaderVariant;
  videoSrc?: string;
  className?: string;
}) {
  const elapsed = useElapsed();
  const [videoOk, setVideoOk] = useState(true);

  const surfer = variant === 'Surfer';
  const pattern = patternFor(surfer ? 'Drive' : variant);
  const resolvedLabel = label ?? (surfer ? 'Subway surfing' : 'Churning');

  const status = (
    <div className="flex items-center gap-2.5">
      <LoaderGrid {...pattern} />
      <span className="tc-shimmer-text tc-label">{resolvedLabel}</span>
      <span aria-hidden="true" className="tc-path text-muted-foreground">
        {elapsed}
      </span>
    </div>
  );

  if (!surfer) {
    return (
      <div role="status" aria-live="polite" aria-atomic="true" className={cn('w-fit', className)}>
        {status}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn('flex w-fit flex-col items-start', className)}
    >
      {status}

      {/* The card follows the line it illustrates, and it is a card rather
          than a background because the video is a diversion, not the status. */}
      <div
        aria-hidden="true"
        className="tc-raise mt-2 w-56 overflow-hidden rounded-[10px] border border-border"
        style={{
          animation: 'tc-pop-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
          transformOrigin: 'top left',
        }}
      >
        <div className="relative aspect-video w-full bg-plate">
          {videoOk ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoOk(false)}
              className="h-full w-full object-cover"
            />
          ) : (
            /* A blocked CDN or an offline reader should not leave a black
               rectangle where the reassurance was supposed to be. */
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
              <LoaderGrid {...DRIVE} />
              <span className="px-3 text-center tc-micro text-plate-quiet">
                Video unavailable
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
