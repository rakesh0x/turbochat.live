import { Globe } from "lucide-react"

export function DashboardMockup() {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            app.turbochat.live
          </div>
        </div>
      </div>

      <div className="flex items-start">
        {/* Sidebar */}
        <div className="w-56 border-r bg-muted/20 p-4 hidden md:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="text-xs text-muted-foreground">MA</div>
            <span className="text-sm font-medium">TurboChat Assistant</span>
          </div>
          <nav className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>▸</span> View site
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>✦</span> Training
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm bg-muted rounded">
              <span>◉</span> Design
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>⊕</span> Domains
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>$</span> Get paid
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>▤</span> Billing
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>☰</span> Chat logs
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>☺</span> Users
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>⚙</span> Settings
            </div>
          </nav>
          <div className="mt-auto pt-8">
            <div className="text-xs text-muted-foreground">Messages</div>
            <div className="text-sm">142 / 500</div>
            <div className="text-xs text-purple-500 mt-1">Upgrade</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-6 h-6 rounded-full bg-purple-100" />
              <span className="text-sm">Support Team</span>
            </div>
          </div>
        </div>

        {/* Design panel */}
        <div className="w-64 border-r p-4 hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium">Design</h3>
            <div className="flex gap-1">
              <button className="px-3 py-1 text-xs bg-muted rounded">General</button>
              <button className="px-3 py-1 text-xs text-muted-foreground">About</button>
              <button className="px-3 py-1 text-xs text-muted-foreground">Pricing</button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Display name</label>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm"></span>
                <div className="w-4 h-4 border rounded" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Logo</label>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm"></span>
                <div className="w-8 h-4 bg-muted rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs">NG</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Nikolas Gibbons</div>
                  <div className="text-xs text-muted-foreground">TurboChat Assistant</div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Favicon</label>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Square image at least 32×32</span>
                <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs">✦</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Background</label>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Accent</label>
              <div className="w-6 h-6 rounded-full bg-foreground mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Heading</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  "#ef4444",
                  "#f97316",
                  "#eab308",
                  "#22c55e",
                  "#14b8a6",
                  "#06b6d4",
                  "#3b82f6",
                  "#8b5cf6",
                  "#ec4899",
                  "#f43f5e",
                  "#0ea5e9",
                  "#6366f1",
                  "#a855f7",
                  "#d946ef",
                  "#1e293b",
                  "#374151",
                  "#4b5563",
                  "#6b7280",
                ].map((color) => (
                  <div key={color} className="w-5 h-5 rounded-full cursor-pointer" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <div className="text-xs mt-1">#000000</div>
              <div className="text-xs text-muted-foreground mt-1">
                Configure how
                <br />your assistant responds.
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className="px-3 py-1.5 text-sm border rounded">Discard changes</button>
            <button className="px-3 py-1.5 text-sm bg-foreground text-background rounded">Save changes</button>
          </div>
        </div>

        {/* Chat preview */}
        <div className="flex-1 p-4">
          <ChatPreview />
        </div>
      </div>
    </div>
  )
}

function ChatPreview() {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-white text-xs">NG</span>
          </div>
          <span className="text-sm font-medium">TurboChat Assistant</span>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Chat</span>
          <span className="text-sm text-muted-foreground">About</span>
          <span className="text-sm text-muted-foreground">Pricing</span>
          <span className="text-sm text-muted-foreground">Log in</span>
          <button className="px-3 py-1 text-xs bg-foreground text-background rounded-full">Sign up</button>
        </nav>
      </div>

      {/* Chat content */}
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">How can I help?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Start by asking a question or
          <br />
          getting help with setup, docs, or billing.
        </p>

        <div className="max-w-md mx-auto">
          <div className="border rounded-lg p-3">
            <input type="text" placeholder="Ask a support question" className="w-full text-sm outline-none" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>📎</span> 0 Files
              </div>
              <button className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-white text-xs">↑</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
