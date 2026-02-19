import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 pt-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">SiteChat Dashboard</p>
            <h1 className="text-xl font-semibold text-zinc-50">Welcome, {user.email}</h1>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-sm font-medium text-zinc-100">Account</h2>
            <p className="mt-2 text-xs text-zinc-400">
              This is a placeholder dashboard to confirm the Supabase auth flow is working. Replace this
              section with your actual app content.
            </p>
            <dl className="mt-4 space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <dt>Email</dt>
                <dd className="font-mono text-zinc-100">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt>User ID</dt>
                <dd className="truncate font-mono text-zinc-400">{user.id}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-sm font-medium text-zinc-100">Next steps</h2>
            <ul className="mt-3 space-y-2 text-xs text-zinc-400">
              <li>• Wire this dashboard into your actual SiteChat data.</li>
              <li>• Add role-based access control using Supabase policies.</li>
              <li>• Customize the auth UI and email templates in Supabase.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}

