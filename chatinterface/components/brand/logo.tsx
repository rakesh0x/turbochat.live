/* ==========================================================================
   Turbochat identity — "The Cited Line"
   --------------------------------------------------------------------------
   Two quiet lines of one of the customer's pages, and between them the answer:
   a marker swipe that outruns the paragraph and runs off the right edge of the
   frame. That is the product in one shape — it read your page, and it can point
   at the line the answer came from.

   Three decisions carry the mark:

   1. The cited line is the marker, #F2E14B, the one colour in this system that
      already means "the answer came from here." It is not decoration; it is the
      subject. The other two lines are the plate's own foreground held back to
      72%, because an uncited page should read as quiet. Hierarchy, not three
      competing bars.

   2. It bleeds. A highlighter swipe overshoots the words, so the cited line
      leaves the frame instead of stopping inside it. This is the whole mark:
      it is a length ratio, so it is the one detail that survives a 16px
      favicon; it is what stops three bars reading as a menu or a list icon;
      it makes the frame part of the drawing rather than a box around it; and
      it is the only "turbo" the logo needs — momentum, not a lightning bolt.

   3. Square ends, flush left. A paragraph is set flush left, so the left edge
      is a hard vertical; the ends are cut, not rounded, because the bars are
      meant to read as set type and because hard ends do not date. The only
      curve in the mark is the frame's, and that tension — soft container,
      hard content — is deliberate.

   Geometry, on a 24 grid:

     frame     24 × 24, rx 5.4 (22.5%)
     lines     page 2.4, cited 3.4, gaps 3.3. The cited line is heavier than
               the lines it sits between, because a chisel marker is taller
               than the x-height it covers — and because uniform bars of
               ragged length are what a loading skeleton looks like. Block
               14.8, so the vertical margin is 4.6: slightly more air above
               and below than the 4 at the left, which is what a stack of
               horizontals needs to sit centred in a square. The cited line's
               own centre lands on 12, the exact centre of the frame.
     lengths   12 / 20 / 7.5. The cited line is 67% longer than the paragraph's
               longest line and reaches x = 24; the last line is a short ragged
               tail, the way prose actually ends.

   There is deliberately no unframed version. On paper the marker is lighter
   than the ink around it, so an unframed cited line goes quiet and the idea
   dies — the marker needs the ink ground to carry. Where one colour is all
   there is, use the frame with all three lines knocked out: the cited line is
   still the one that is longest and leaves the frame.

   The marker is solid here, and this is the one place in the product where it
   is not a multiply wash: in the mark there is no text underneath to keep
   legible. The cited line *is* the marker.
   ========================================================================== */

import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/* --------------------------------------------------------------------------
   The mark
   -------------------------------------------------------------------------- */

/**
 * The canonical mark: the framed tile. Use this anywhere the logo appears —
 * nav, favicon, avatar, widget header.
 *
 * The ground is `--plate`, which already lifts off the canvas in the dark
 * theme; an ink tile on an ink page would have no edge.
 */
export function BrandMark({ className, ...props }: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-7 shrink-0', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="24" height="24" rx="5.4" fill="var(--plate)" />
      {/* the page, held back to 72% so the answer is the only thing that
          reads first — an uncited page should be quiet */}
      <rect x="4" y="4.6" width="12" height="2.4" fill="var(--plate-foreground)" fillOpacity="0.72" />
      {/* the cited line — heavier, longest, and it leaves the frame */}
      <rect x="4" y="10.3" width="20" height="3.4" fill="var(--marker)" />
      <rect x="4" y="17" width="7.5" height="2.4" fill="var(--plate-foreground)" fillOpacity="0.72" />
    </svg>
  );
}

/** Back-compat: the old violet chip was imported under this name. */
export { BrandMark as BrandTile };

/* --------------------------------------------------------------------------
   The wordmark and the lockup
   -------------------------------------------------------------------------- */

/**
 * Inter Tight Medium at -0.03em, lowercase, one colour. Never Bold, and never
 * split into two colours — the marker belongs to the mark, and one accent per
 * logo is the reason it reads at all.
 */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display font-medium tracking-[-0.03em]', className)}>turbochat</span>
  );
}

/**
 * Mark + wordmark. The mark's size and the gap are both in `em`, so the whole
 * lockup scales in proportion from a single `text-[…]` on this element.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[0.42em] font-display text-[17px] font-medium leading-none tracking-[-0.03em] text-foreground',
        className,
      )}
    >
      <BrandMark className="size-[1.3em]" />
      turbochat
    </span>
  );
}
