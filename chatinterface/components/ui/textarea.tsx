import * as React from "react"

import { cn } from "@/lib/utils"

/* Same contract as Input: sunk surface, one border, a ring only on keyboard
   focus. `field-sizing-content` stays so the box grows with what is typed. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground border-border bg-surface-2 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base transition-[color,border-color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring/50",
        "aria-invalid:border-danger-border aria-invalid:ring-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
