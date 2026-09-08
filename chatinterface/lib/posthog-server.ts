import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  if (!posthogClient) {
    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN
    if (!token) return null as unknown as PostHog
    posthogClient = new PostHog(
      token,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
  return posthogClient
}
