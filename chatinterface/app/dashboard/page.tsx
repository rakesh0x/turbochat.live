import dynamic from "next/dynamic"
import type { Metadata } from "next"

const ChatInterface = dynamic(
    () => import("@/components/landing/TrainingChatbotsUI").then((mod) => mod.ChatInterface),
    {
        loading: () => (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="text-sm text-muted-foreground">Loading dashboard...</div>
            </div>
        ),
    },
)

export const metadata: Metadata = {
    title: "Dashboard",
    robots: {
        index: false,
        follow: false,
    },
}

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <ChatInterface />
        </div>
    )
}
