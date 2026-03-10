import { createClient } from "../../lib/supabase/client"
import { redirect } from "next/navigation"
import { ChatInterface } from "../../components/chat-interface"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/")
    }

    return (
        <div className="min-h-screen bg-background">
            <ChatInterface />
        </div>
    )
}