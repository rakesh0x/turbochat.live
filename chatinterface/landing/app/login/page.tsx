import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"
import { Navbar } from "@/components/ui/navbar"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-24">
        <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.2fr_minmax(0,1fr)] items-center">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              SiteChat • Secure access
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Sign in to your SiteChat dashboard
            </h1>
            <p className="max-w-xl text-sm text-zinc-400">
              Connect your site, manage conversations, and get AI-powered insights in one place.
              Authentication is powered by Supabase and secured with email + password.
            </p>
            <p className="text-xs text-zinc-500">
              Looking for the marketing page?{" "}
              <Link href="/" className="font-medium text-zinc-100 underline-offset-4 hover:underline">
                Go back home
              </Link>
              .
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </main>
  )
}

