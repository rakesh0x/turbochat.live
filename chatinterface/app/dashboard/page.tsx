import { redirect } from "next/navigation"
import { ChatInterface } from "@/landing/components/chat-interface"
import { getServerSession } from "next-auth/next"
import { GET } from "@/app/api/auth/[...nextauth]/route"

export default async function DashboardPage() {
    const session: any = await getServerSession(GET as any)

    if (!session) {
        return redirect("/")
    }

    // Check user plan via backend
    const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://fine-tuning-426l.onrender.com' : 'http://127.0.0.1:8000');
    
    let backendDown = false;

    try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            },
            cache: 'no-store'
        });
        
        if (!res.ok) {
            console.error("Failed to fetch user data, returning to home.");
            backendDown = true;
        } else {
            const userData = await res.json();
            // Redirect logic: no plan AND 0 credits
            if (userData.plan === 'free' && userData.credits <= 0) {
                 shouldRedirectToPricing = true;
            }
        }
    } catch (error) {
        console.error("Dashboard server validation error:", error);
        backendDown = true;
    }

    return (
        <div className="min-h-screen bg-background">
            <ChatInterface />
        </div>
    )
}
