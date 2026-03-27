import { ChatInterface } from "../../components/chat-interface"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Dashboard",
    robots: {
        index: false,
        follow: false,
    },
}

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            <ChatInterface />
        </div>
    )
}