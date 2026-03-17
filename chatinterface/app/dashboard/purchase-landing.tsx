"use client"

import { useState } from "react"

interface PurchaseLandingProps {
  userEmail: string
  userName: string
  userId: string
}

const PRO_PLAN_PRODUCT_ID = "pdt_0NaGTaLaCP8TsMwaiw1t7"

export function PurchaseLanding({ userEmail, userName, userId }: PurchaseLandingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePurchase = async () => {
    setError("")

    if (!userEmail) {
      setError("Unable to start checkout. Please sign in again.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [
            {
              product_id: PRO_PLAN_PRODUCT_ID,
              quantity: 1,
            },
          ],
          customer: {
            email: userEmail,
            name: userName || userEmail,
          },
          metadata: {
            user_id: userId,
          },
          return_url: `${window.location.origin}/dashboard`,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.checkout_url) {
        throw new Error(data?.message || "Failed to create checkout session")
      }

      window.location.href = data.checkout_url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Turbochat AI Dashboard</p>
          <h1 className="mt-4 text-3xl md:text-5xl font-semibold leading-tight">
            Activate your plan to create your first chatbot
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            You are signed in, but your current account has no active paid plan credits.
            Complete checkout to unlock chatbot creation, training, and deployment.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">Build unlimited chatbot knowledge bases</div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">Train bots from your website URLs and docs</div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">Deploy widget instantly on your site</div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Starting checkout..." : "Purchase Pro Plan"}
            </button>

            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
            >
              I already purchased, refresh dashboard
            </a>
          </div>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </section>
      </div>
    </main>
  )
}
