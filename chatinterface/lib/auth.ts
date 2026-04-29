import { signIn, signOut } from "next-auth/react";

export async function signInWithGoogle(router?: any) {
    // NextAuth handles the redirect to standard callback internally
    await signIn("google", { callbackUrl: "/dashboard" });
}

export async function signOutUser() {
    await signOut({ callbackUrl: "/" });
}