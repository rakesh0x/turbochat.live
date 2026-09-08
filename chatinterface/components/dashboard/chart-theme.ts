'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/* ==========================================================================
   Chart colours, resolved from the design tokens
   --------------------------------------------------------------------------
   Recharts writes SVG presentation attributes, and `var()` inside those is
   not dependable across browsers — so the charts used to be wired to literal
   hexes (`#06b6d4`, `#f1f5f9`), which is why they stayed sky-blue while the
   rest of the product moved to ink and teal, and why they were unreadable in
   dark mode.

   Reading the computed custom properties once per theme change gives the
   charts the same palette as everything else, with no duplicated hexes to
   drift. `resolvedTheme` is the dependency: when it flips, so do these.
   ========================================================================== */

export type ChartTheme = {
  signal: string;
  ink: string;
  grid: string;
  axis: string;
  surface: string;
  border: string;
  series: string[];
};

const FALLBACK: ChartTheme = {
  signal: '#1d6e68',
  ink: '#14181b',
  grid: 'rgba(20, 24, 27, 0.1)',
  axis: '#5b655f',
  surface: '#f6f7f4',
  border: 'rgba(20, 24, 27, 0.1)',
  series: ['#1d6e68', '#14181b', '#8a5a12', '#2e6a4e', '#8d3128'],
};

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setTheme({
      signal: readToken(styles, '--signal', FALLBACK.signal),
      ink: readToken(styles, '--ink', FALLBACK.ink),
      grid: readToken(styles, '--border', FALLBACK.grid),
      axis: readToken(styles, '--ink-quiet', FALLBACK.axis),
      surface: readToken(styles, '--card', FALLBACK.surface),
      border: readToken(styles, '--border', FALLBACK.border),
      series: [
        readToken(styles, '--chart-1', FALLBACK.series[0]),
        readToken(styles, '--chart-2', FALLBACK.series[1]),
        readToken(styles, '--chart-3', FALLBACK.series[2]),
        readToken(styles, '--chart-4', FALLBACK.series[3]),
        readToken(styles, '--chart-5', FALLBACK.series[4]),
      ],
    });
  }, [resolvedTheme]);

  return theme;
}
