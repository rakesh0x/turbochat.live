"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithGoogle } from "../../lib/auth"
import { useSession } from "next-auth/react"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4">
      <nav className="max-w-5xl mx-auto rounded-3xl sm:rounded-full bg-zinc-900/70 border border-zinc-800/50 backdrop-blur-md">
        <div className="flex items-center justify-between h-12 px-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold text-zinc-100">
            SiteChat
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-1.5 text-sm rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/dashboard"
                className="ml-2 px-4 py-1.5 text-sm rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => signInWithGoogle(router)}
                className="ml-2 px-4 py-1.5 text-sm rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-100 hover:bg-zinc-800/70 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {isMenuOpen && (
          <div className="md:hidden px-3 pb-3 border-t border-zinc-800/60">
            <div className="flex flex-col pt-2 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-1 px-3 py-2.5 text-sm rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    signInWithGoogle(router)
                  }}
                  className="mt-1 px-3 py-2.5 text-sm rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors text-left"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
