import { Clock3, ShieldCheck, Headset, Code2 } from "lucide-react"

const metrics = [
  {
    value: "Under 10s",
    label: "Build Time",
    description: "From URL to live AI",
    icon: Clock3,
    glow: "from-cyan-500/20 to-sky-500/5",
  },
  {
    value: "95%+",
    label: "Answer Quality",
    description: "Source-grounded responses",
    icon: ShieldCheck,
    glow: "from-emerald-500/20 to-teal-500/5",
  },
  {
    value: "24/7",
    label: "Support Coverage",
    description: "Always available for users",
    icon: Headset,
    glow: "from-violet-500/20 to-indigo-500/5",
  },
  {
    value: "1-Line",
    label: "Integration",
    description: "Paste and deploy instantly",
    icon: Code2,
    glow: "from-amber-500/20 to-orange-500/5",
  },
]

export function ImpactSection() {
  return (
    <section className="px-6 py-24 bg-slate-900/20">
      <div className="max-w-5xl mx-auto">
        {/* Impact Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Our Impact</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-100 mb-4">Built for speed, trusted at scale</h2>
          <p className="text-slate-400 max-w-lg mx-auto text-balance">
            Numbers that speak for themselves. See why thousands choose us.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-500/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${metric.glow} opacity-80`} />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/80 text-slate-200">
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Live Metric</span>
                </div>

                <p className="font-display text-3xl md:text-4xl font-bold text-slate-100 mb-1 group-hover:text-white transition-colors text-left">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-slate-200 mb-1 text-left">{metric.label}</p>
                <p className="text-xs text-slate-400 text-left">{metric.description}</p>

                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-slate-200/70 to-cyan-300/70" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
