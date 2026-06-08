import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-12 px-6 bg-background border-t">
      <div className="max-w-6xl mx-auto">
        {/* Navigation links */}
        <nav className="flex flex-wrap gap-6 mb-12">
          <Link href="#how-it-works" className="text-sm hover:text-muted-foreground transition-colors">
            How it works
          </Link>
          <Link href="/pricing" className="text-sm hover:text-muted-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#" className="text-sm hover:text-muted-foreground transition-colors">
            Integrations
          </Link>
          <Link href="#" className="text-sm hover:text-muted-foreground transition-colors">
            Documentation
          </Link>
          <Link href="#" className="text-sm hover:text-muted-foreground transition-colors">
            Security
          </Link>
          <Link href="#faq" className="text-sm hover:text-muted-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/blog" className="text-sm hover:text-muted-foreground transition-colors">
            Blog
          </Link>
        </nav>

        {/* Copyright and legal */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <p className="text-sm text-muted-foreground">© 2026 TurboChat AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Large logo */}
        <div className="overflow-hidden text-center">
          <h2 className="text-[8rem] md:text-[12rem] lg:text-[16rem] tracking-tight leading-none lowercase font-serif font-light text-accent">
            turbochat
          </h2>
        </div>
      </div>
    </footer>
  )
}
