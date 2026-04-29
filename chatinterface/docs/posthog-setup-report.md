<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Turbochat AI Next.js App Router project. Client-side tracking is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern). Server-side tracking uses a shared `posthog-node` singleton in `lib/posthog-server.ts`. A reverse proxy was configured in `next.config.mjs` to route PostHog traffic through `/ingest` to reduce ad-blocker interference. Environment variables were written to `.env.local`. User identification happens client-side on checkout initiation and server-side on payment confirmation via webhook.

| Event | Description | File |
|-------|-------------|------|
| `checkout_initiated` | User clicks "Start Free Trial" and checkout begins | `app/dashboard/purchase-landing.tsx` |
| `checkout_redirected` | Checkout session created; user redirected to payment page | `app/dashboard/purchase-landing.tsx` |
| `checkout_failed` | Checkout session creation failed on the client | `app/dashboard/purchase-landing.tsx` |
| `checkout_session_created` | Server-side: Dodo Payments checkout session created successfully | `app/api/checkout/route.ts` |
| `payment_succeeded` | Server-side: Dodo webhook confirms payment and credits updated | `app/api/webhooks/dodo/route.ts` |
| `chatbot_creation_started` | User submits chatbot creation form and training begins | `components/createChatbot.tsx` |
| `chatbot_creation_completed` | Chatbot training finishes and bot becomes active | `components/createChatbot.tsx` |
| `chatbot_creation_failed` | Chatbot training failed (includes credit errors) | `components/createChatbot.tsx` |
| `chatbot_published` | User publishes a hosted mini site for their chatbot | `components/deploy.tsx` |
| `chatbot_unpublished` | User unpublishes the hosted mini site | `components/deploy.tsx` |
| `chatbot_embed_downloaded` | User downloads HTML bundle or index.html for embedding | `components/deploy.tsx` |
| `message_sent` | User sends a message in the AI chat composer | `components/Composer.tsx` |
| `pricing_plan_clicked` | User clicks a CTA on the pricing page | `app/pricing/page.tsx` |

## Next steps

We've built a dashboard and 5 insights to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/384527/dashboard/1489489)
- **Checkout Conversion Funnel**: [https://us.posthog.com/project/384527/insights/lm5JkM4v](https://us.posthog.com/project/384527/insights/lm5JkM4v)
- **Chatbot Creation Funnel**: [https://us.posthog.com/project/384527/insights/SEGPfauQ](https://us.posthog.com/project/384527/insights/SEGPfauQ)
- **Payments Over Time**: [https://us.posthog.com/project/384527/insights/DqEYHMiJ](https://us.posthog.com/project/384527/insights/DqEYHMiJ)
- **Chatbot Creation Failures**: [https://us.posthog.com/project/384527/insights/GvXOu9P3](https://us.posthog.com/project/384527/insights/GvXOu9P3)
- **Daily Active Chat Users**: [https://us.posthog.com/project/384527/insights/FIuEXatd](https://us.posthog.com/project/384527/insights/FIuEXatd)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
