"use client"
import { Asterisk, MoreHorizontal, Menu, ChevronDown, Sparkles } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "./GhostIconButton"

export default function Header({ createNewChat, sidebarCollapsed, setSidebarOpen }) {
  const [selectedBot, setSelectedBot] = useState("GPT-5")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const chatbots = [
    { name: "GPT-5", icon: "🤖", badge: "Latest" },
    { name: "Claude Sonnet 4", icon: "🎭", badge: null },
    { name: "Gemini", icon: "💎", badge: null },
    { name: "Assistant", icon: <Sparkles className="h-4 w-4" />, badge: "Pro" },
  ]

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-xl">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="hidden md:flex relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-semibold tracking-tight hover:bg-accent/80 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-premium shadow-sm"
        >
          {typeof chatbots.find((bot) => bot.name === selectedBot)?.icon === "string" ? (
            <span className="text-sm">{chatbots.find((bot) => bot.name === selectedBot)?.icon}</span>
          ) : (
            chatbots.find((bot) => bot.name === selectedBot)?.icon
          )}
          <span className="text-gradient">{selectedBot}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-premium-lg z-50 overflow-hidden">
              <div className="p-1.5">
                {chatbots.map((bot) => (
                  <button
                    key={bot.name}
                    onClick={() => {
                      setSelectedBot(bot.name)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-premium ${
                      selectedBot === bot.name 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-accent/80 text-foreground'
                    }`}
                  >
                    <span className="text-base">
                      {typeof bot.icon === "string" ? bot.icon : bot.icon}
                    </span>
                    <span className="flex-1 font-medium">{bot.name}</span>
                    {bot.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                        {bot.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
