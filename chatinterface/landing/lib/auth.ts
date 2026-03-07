import { createClient } from "@/landing/lib/supabase/client";

export async function signInWithGoogle() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) {
        console.error("OAuth error:", error.message);
        return;
    }

    if (data.url) {
        window.location.href = data.url;
    }
}