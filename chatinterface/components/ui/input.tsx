import * as React from "react"

import { cn } from "@/lib/utils"

/* The field is a *sunk* surface, not a raised one: `bg-surface-2` sits a step
   below the `bg-card` panels it lives in, so an input reads as a well you type
   into rather than a chip stuck on top. That is what carries the affordance
   here — there is no shadow, and there is no second border colour at rest.

   Selection is deliberately not restyled. The site defines a marker-yellow
   `::selection` globally; the stock `selection:bg-primary` override used to
   swallow it inside form fields, which made highlighted text in an input look
   like it belonged to a different product. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground border-border bg-surface-2 h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring/50",
        "aria-invalid:border-danger-border aria-invalid:ring-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
