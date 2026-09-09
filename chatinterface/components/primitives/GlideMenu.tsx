'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   GlideMenu
   --------------------------------------------------------------------------
   One highlight that travels between rows, rather than every row owning a
   hover background that blinks on and off independently. The difference is
   legible: a list with a gliding highlight reads as a single control the
   pointer is moving through; a list of blinking backgrounds reads as eight
   controls that happen to be stacked.

   The primitive owns the highlight's geometry — it measures the row and
   places the element — so `highlightClassName` carries paint only (radius,
   background), never position.

   Rows opt in with the `rowSelector` attribute and must sit above the
   highlight (`relative z-10`): an absolutely positioned sibling paints over
   in-flow content, so an unpositioned row would end up underneath its own
   highlight.
   ========================================================================== */

type Box = { top: number; left: number; width: number; height: number };

const TRAVEL = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function GlideMenu({
  children,
  className,
  rowSelector = '[data-menu-row]',
  highlightClassName,
}: {
  children: ReactNode;
  className?: string;
  /** Which descendants the highlight is allowed to land on. */
  rowSelector?: string;
  /** Paint only — radius and background. Geometry is the primitive's job. */
  highlightClassName?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [calm, setCalm] = useState(false);

  /* The first hover fades in where the pointer already is. Only once the
     highlight is on screen does moving it become a slide — otherwise it
     flies in from wherever the previous hover happened to leave it. */
  const [placed, setPlaced] = useState(false);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setBox({
      top: row.offsetTop,
      left: row.offsetLeft,
      width: row.offsetWidth,
      height: row.offsetHeight,
    });
  }, []);

  const land = useCallback(
    (row: HTMLElement) => {
      rowRef.current = row;
      measure();
    },
    [measure],
  );

  const clear = useCallback(() => {
    rowRef.current = null;
    setBox(null);
    setPlaced(false);
  }, []);

  useEffect(() => {
    if (!box) return;
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, [box]);

  /* Rows are measured in layout pixels, so a resize invalidates the box. */
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  function rowFrom(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const row = target.closest<HTMLElement>(rowSelector);
    return row && hostRef.current?.contains(row) ? row : null;
  }

  return (
    <div
      ref={hostRef}
      className={cn('relative', className)}
      onPointerOver={(event) => {
        const row = rowFrom(event.target);
        if (row) land(row);
      }}
      onPointerLeave={clear}
      /* Keyboard arrives by focus, not by pointer, and deserves the same
         highlight — otherwise tabbing the list lights nothing at all. */
      onFocus={(event) => {
        const row = rowFrom(event.target);
        if (row) land(row);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clear();
      }}
    >
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute left-0 top-0', highlightClassName)}
        style={{
          opacity: box ? 1 : 0,
          transform: box ? `translate3d(${box.left}px, ${box.top}px, 0)` : undefined,
          width: box?.width,
          height: box?.height,
          transitionProperty: placed ? 'transform, width, height, opacity' : 'opacity',
          transitionDuration: calm ? '0ms' : placed ? '220ms' : '140ms',
          transitionTimingFunction: TRAVEL,
        }}
      />
      {children}
    </div>
  );
}
