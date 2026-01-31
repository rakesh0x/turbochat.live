import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium shadow-sm"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />}
      <span className="hidden sm:inline font-medium">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
