import { FileText, Globe, Upload } from "lucide-react"
import { Button } from "./ui/button"
import { signInWithGoogle } from "@/lib/auth"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-sm border rounded-full mb-6">How it works</span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-balance">
            The fastest way to
            <br />
            launch AI support on your site
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Learn how to train an AI chatbot on website docs, customize it to your brand, and
            embed an AI support widget &mdash; all without engineering hours. Turbochat is the
            RAG chatbot platform built for SaaS teams.
          </p>
        </div>

        {/* Step 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">1. Train AI chatbot on website docs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Add your website, help center, PDFs, and product docs. TurboChat uses RAG (Retrieval-Augmented
              Generation) to index your content so responses stay grounded in your actual business information.
              This is how to train an AI chatbot on website docs the right way.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <InstructionsCard />
          </div>
        </div>

        {/* Step 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <BrandCard />
          </div>
          <div>
            <h3 className="font-serif text-2xl md:text-3xl mb-4">2. Match your brand voice</h3>
            <p className="text-muted-foreground leading-relaxed">
              Set logo, colors, assistant name, and response tone. Keep your support experience on-brand instead of
              looking like a generic third-party widget.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">3. Embed AI support widget on your website</h3>
            <p className="text-muted-foreground leading-relaxed">
              Copy a single snippet to embed an AI support widget on your website. Launch on your own domain
              and product site. Customers get instant RAG chatbot answers in the same place they browse docs and features.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <DomainCard />
          </div>
        </div>

        {/* Step 4 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <PaymentsCard />
          </div>
          <div>
            <h3 className="font-serif text-2xl md:text-3xl mb-4">4. Reduce support ticket volume with AI</h3>
            <p className="text-muted-foreground leading-relaxed">
              Start with a free trial, then move to paid plans as your volume grows. TurboChat helps reduce
              customer support ticket volume with AI automation built for SaaS support teams &mdash; an
              affordable Intercom alternative for startups.
            </p>
          </div>
        </div>

        {/* Step 5 */}
        <div className="text-center mb-16">
          <h3 className="font-serif text-2xl md:text-3xl mb-4">5. Go live in minutes</h3>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Your assistant is ready to answer onboarding, pricing, setup, and product questions 24/7 so your team can
            focus on high-impact support.
          </p>
          <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6">
            Start free trial
          </Button>
        </div>

        {/* Chat demo */}
        <ChatDemo />
      </div>
    </section>
  )
}

function InstructionsCard() {
  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <h4 className="text-sm font-medium mb-4">Instructions</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Assistant role</label>
            <div className="h-0.5 bg-muted mt-2 w-full" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Response style</label>
            <div className="h-0.5 bg-muted mt-2 w-full" />
          </div>
        </div>

        <h4 className="text-sm font-medium mt-6 mb-3">Files</h4>
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <FileText className="w-4 h-4 text-purple-500" />
          <span className="text-sm">support-playbook.pdf</span>
        </div>

        <h4 className="text-sm font-medium mt-6 mb-3">Website</h4>
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">docs.turbochat.live</span>
        </div>
      </div>
    </div>
  )
}

function BrandCard() {
  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <span className="text-purple-500 font-bold">A</span>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Upload className="w-4 h-4" />
            Upload brand mark
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Background</span>
            <div className="w-8 h-8 rounded-full bg-gray-100 border" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Primary color</span>
            <div className="w-8 h-8 rounded-full bg-purple-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DomainCard() {
  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">help.yourcompany.com</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-sm text-green-600">Domain verified</span>
        </div>
      </div>
    </div>
  )
}

function PaymentsCard() {
  return (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <span className="text-purple-500 font-bold text-xl italic">stripe</span>
          <Button variant="outline" size="sm">
            Connect billing
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 border rounded-lg text-sm">Starter</span>
            <span className="px-3 py-1.5 border rounded-lg text-sm">$9/mo</span>
            <span className="text-green-500 text-sm font-medium">7-day trial</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 border rounded-lg text-sm">Pro</span>
            <span className="px-3 py-1.5 border rounded-lg text-sm">$29/mo</span>
            <span className="text-green-500 text-sm font-medium">Most popular</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="mt-4 gap-1 bg-transparent">
          <span>+</span> Add tier
        </Button>
      </div>
    </div>
  )
}

function ChatDemo() {
  return (
    <div className="relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950/10 to-transparent rounded-3xl" />

      <div className="relative rounded-3xl p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-purple-500 text-xs font-bold">A</span>
              </div>
              <span className="text-sm font-medium">TurboChat Assistant</span>
            </div>
            <nav className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Chat</span>
              <span className="text-sm text-muted-foreground">About</span>
              <span className="text-sm text-muted-foreground">Pricing</span>
              <span className="text-sm text-muted-foreground">Log in</span>
              <button className="px-3 py-1 text-xs bg-purple-500 text-white rounded-full">Sign up</button>
            </nav>
          </div>

          {/* Chat content */}
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">How can I help today?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ask about setup, integrations, pricing,
              <br />
              troubleshooting, or product features.
            </p>

            <div className="max-w-md mx-auto mb-6">
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

            <div className="text-left max-w-md mx-auto space-y-2">
              <p className="text-sm text-muted-foreground">How do I embed TurboChat on my site?</p>
              <p className="text-sm text-muted-foreground">How is pricing calculated after trial?</p>
              <p className="text-sm text-muted-foreground">Can I train from docs and PDFs together?</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
