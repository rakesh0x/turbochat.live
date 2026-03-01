import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-zinc-100 tracking-tight">
                        Authentication Error
                    </h1>
                    <p className="mt-4 text-zinc-400 text-lg">
                        Something went wrong while trying to sign you in. This could be due to an expired link or a connection issue.
                    </p>
                </div>

                <div className="pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Return to Homepage
                    </Link>
                </div>

                <div className="mt-12 text-zinc-600 text-sm">
                    If the problem persists, please try clearing your browser cookies or contacting support.
                </div>
            </div>
        </div>
    )
}
