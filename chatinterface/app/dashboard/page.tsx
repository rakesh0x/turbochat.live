import { redirect } from "next/navigation"
import { ChatInterface } from "@/landing/components/chat-interface"
import { getServerSession } from "next-auth/next"
import { GET } from "@/app/api/auth/[...nextauth]/route"

export default async function DashboardPage() {
    const session: any = await getServerSession(GET as any)

    let showPurchaseLanding = false

    if (!session) {
        return redirect("/")
    }

    // Check user plan via backend
    const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.turbochat.live' : 'http://127.0.0.1:8000');
    
    let backendDown = false

    try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            },
            cache: 'no-store'
        });
        
        if (!res.ok) {
            console.error("Failed to fetch user data, showing app by default.")
            backendDown = true
        } else {
            const userData = await res.json()
            // No paid plan and no credits left: show purchase landing.
            if (userData.plan === 'free' && userData.credits <= 0) {
                showPurchaseLanding = true
            }
        }
    } catch (error) {
        console.error("Dashboard server validation error:", error)
        backendDown = true
    }

    return (
        <div className="min-h-screen bg-background">
            <ChatInterface />
        </div>
    )
}
