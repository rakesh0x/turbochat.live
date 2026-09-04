import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"
import { BrandLogo } from "./logo"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "mailto:hello@turbochat.live" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API reference", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
]

const socials = [
  { label: "Twitter / X", href: "#", icon: Twitter },
  { label: "GitHub", href: "#", icon: Github },
  { label: "LinkedIn", href: "#", icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Train an AI support agent on your docs and embed it on your website in minutes. Answers, cited. Support,
              automated.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-semibold">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© 2026 TurboChat AI. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </div>

      {/* giant wordmark */}
      <div className="overflow-hidden px-5 pb-2">
        <p className="select-none text-center font-serif text-[24vw] font-light leading-[0.8] tracking-tight text-foreground/[0.04] md:text-[20vw]">
          turbochat
        </p>
      </div>
    </footer>
  )
}
