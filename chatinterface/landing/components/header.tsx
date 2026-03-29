"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { signInWithGoogle } from "../lib/auth"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between max-w-7xl mx-auto">
      <Link href="/" className="font-serif text-xl italic">
        turbochat
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          How it works
        </Link>
        <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
        <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          FAQ
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => signInWithGoogle()}>
            Sign in
          </Button>
        )}
        <Button
          size="sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          onClick={() => (session?.user ? (window.location.href = "/dashboard") : signInWithGoogle())}
        >
          Start free trial
        </Button>
      </div>
    </header>
  )
}
