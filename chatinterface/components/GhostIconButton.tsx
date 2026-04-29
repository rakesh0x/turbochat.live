import React from "react";
import type { GhostIconButtonProps } from "@/lib/types/ui";


export default function GhostIconButton({ label, children }: GhostIconButtonProps) {
    return (
        <button
            className="hidden rounded-xl border border-border/60 bg-card/80 p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex transition-premium shadow-sm"
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}
