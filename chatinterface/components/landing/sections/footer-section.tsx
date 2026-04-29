import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"

const footerLinks = {
  product: [
    { label: "Turbochat AI", href: "/turbochat" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },

    { label: "Documentation", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Why Turbochat", href: "/turbochat" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
  ],
}

export function FooterSection() {
  return (
    <footer className="pt-16 border-t border-slate-800/70 overflow-x-clip">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 rounded-3xl border border-slate-800/60 bg-slate-950/60 p-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-xl font-semibold text-slate-100">
              Turbochat AI
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-xs">
              Build a custom AI chatbot from any URL in seconds. The power of AI for every website.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-slate-100 mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold text-slate-100 mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-slate-100 mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/70 flex flex-col md:flex-row items-center justify-between gap-4 mb-0">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Turbochat AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-slate-400 hover:text-slate-200 transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-slate-200 transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-slate-400 hover:text-slate-200 transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-15 w-full border-t border-slate-800/70 bg-gradient-to-b from-transparent to-cyan-950/20">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(70%_120%_at_50%_100%,rgba(34,211,238,0.22),transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-6 sm:px-8 md:px-0">
          <p className="select-none w-full overflow-hidden text-center font-display font-bold leading-[0.78] tracking-[-0.03em] text-[clamp(3.75rem,13vw,10rem)] text-transparent bg-clip-text bg-gradient-to-b from-slate-200/28 via-slate-300/14 to-slate-300/0 whitespace-nowrap mb-0">
            Turbochat AI
          </p>
        </div>
      </div>
    </footer>
  )
}