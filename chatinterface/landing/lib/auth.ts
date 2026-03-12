import { createClient } from "./supabase/client";

export async function signInWithGoogle(router?: any) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session && router) {
        router.push("/dashboard")
    }

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