"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { BrandLogo } from "./logo"
import { signInWithGoogle } from "@/lib/auth"

const links = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border bg-background/80 pl-5 pr-2 shadow-sm backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "border-border shadow-lg shadow-black/5 dark:shadow-black/20" : "border-transparent"
        }`}
      >
        <Link href="/" aria-label="TurboChat home" onClick={() => setOpen(false)}>
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => signInWithGoogle()}
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Sign in
          </button>
          <button
            onClick={() => signInWithGoogle()}
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all hover:bg-violet-500"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border bg-background p-3 shadow-xl md:hidden">
          <nav className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
            <button
              onClick={() => signInWithGoogle()}
              className="rounded-full border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </button>
            <button
              onClick={() => signInWithGoogle()}
              className="rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Start free
            </button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
