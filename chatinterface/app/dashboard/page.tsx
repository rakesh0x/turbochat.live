import { createClient } from "@/landing/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/landing/components/chat-interface"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        return redirect("/")
    }

    // Check user plan via backend
    const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            },
            cache: 'no-store'
        });
        if (!res.ok) {
            console.error("Failed to fetch user data, returning to home.");
            return redirect("/?error=backend_down");
        }
        
        const userData = await res.json();
        // Redirect logic: no plan AND 0 credits
        if (userData.plan === 'free' && userData.credits <= 0) {
             return redirect("/#pricing");
        }
    } catch (error) {
        console.error("Dashboard server validation error:", error);
        return redirect("/?error=backend_down");
    }

    return (
        <div className="min-h-screen bg-background">
            <ChatInterface />
        </div>
    )
}