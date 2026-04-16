import { ChatInterface } from "@/landing/components/chat-interface"
import { headers } from "next/headers"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function DashboardPage() {
    try {
        const requestHeaders = await headers()
        const host = requestHeaders.get("host")
        const protocol = requestHeaders.get("x-forwarded-proto") ?? "http"
        const cookie = requestHeaders.get("cookie") ?? ""

        if (!host) {
            throw new Error("Missing host header")
        }

        const res = await fetch(`${protocol}://${host}/api/users/me`, {
            method: "GET",
            cache: "no-store",
            headers: {
                cookie,
            },
        })
        
        if (!res.ok) {
            console.error("Failed to fetch user data, showing app by default.:")
            const errorText = await res.text()
            console.error("Proxy response:", res.status, errorText)
        }
    } catch (error) {
        console.error("Dashboard server validation error:", error)
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <ChatInterface />
        </div>
    )
}
