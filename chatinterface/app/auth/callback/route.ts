import { NextResponse } from 'next/server'
import { createClient } from '@/landing/lib/supabase/server'
import { redirect } from 'next/dist/server/api-utils'
import { signInWithGoogle } from '@/landing/lib/auth'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    console.log("got the code:", code)

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        return NextResponse.redirect(`${origin}${next}`)
    }

    console.log("got next:", next)

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Check if we have a user anyway (e.g. session already exists)

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}