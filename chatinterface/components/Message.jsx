import { cls } from "./utils"

export default function Message({ role, children }) {
  const isUser = role === "user"
  return (
    <div className={cls("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary text-[10px] font-bold text-white shadow-md ring-2 ring-primary/20">
          AI
        </div>
      )}
      <div
        className={cls(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "gradient-primary text-white shadow-md"
            : "bg-card text-foreground border border-border/60 shadow-premium",
        )}
      >
        {children}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-[10px] font-bold text-accent-foreground shadow-sm ring-2 ring-border/40">
          JD
        </div>
      )}
    </div>
  )
}
