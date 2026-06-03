# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the TurboChat Next.js App Router project. The integration builds on existing tracking already in place (chatbot creation, deployment, checkout, messaging) and adds new events for chatbot management, training, model selection, search, and settings. User identification via `posthog.identify()` is now wired into the session lifecycle through a `PostHogIdentifier` component in `app/providers.tsx`, ensuring every authenticated user is linked to their PostHog profile automatically.

The client-side PostHog is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern) and the reverse proxy rewrites in `next.config.mjs` route PostHog traffic through `/ingest` to avoid ad blockers. Server-side tracking uses `lib/posthog-server.ts` with `posthog-node`, already integrated in the checkout and webhook routes.

## Events Added

| Event Name | Description | File |
|---|---|---|
| `chatbot_deleted` | User confirms deletion of a chatbot | `components/Mychatbots.tsx` |
| `chatbot_selected` | User opens/tests a chatbot from the list | `components/Mychatbots.tsx` |
| `chatbot_settings_saved` | User saves settings changes for a chatbot | `components/SettingsPage.tsx` |
| `ai_model_selected` | User switches AI model from the header dropdown | `components/Header.tsx` |
| `conversation_searched` | User performs a search in the search modal | `components/SearchModal.tsx` |
| `new_chat_started` | User starts a new chat from the search modal | `components/SearchModal.tsx` |
| `training_website_added` | User initiates adding a website as training data | `components/TrainingPage.tsx` |
| `training_files_uploaded` | User initiates uploading files as training data | `components/TrainingPage.tsx` |

### Pre-existing events (not modified)

| Event Name | File |
|---|---|
| `chatbot_creation_started` | `components/createChatbot.tsx` |
| `chatbot_creation_completed` | `components/createChatbot.tsx` |
| `chatbot_creation_failed` | `components/createChatbot.tsx` |
| `chatbot_published` | `components/deploy.tsx` |
| `chatbot_unpublished` | `components/deploy.tsx` |
| `chatbot_embed_downloaded` | `components/deploy.tsx` |
| `message_sent` | `components/Composer.tsx` |
| `pricing_plan_clicked` | `app/pricing/page.tsx` |
| `checkout_initiated` | `app/dashboard/purchase-landing.tsx` |
| `checkout_redirected` | `app/dashboard/purchase-landing.tsx` |
| `checkout_failed` | `app/dashboard/purchase-landing.tsx` |
| `checkout_session_created` | `app/api/checkout/route.ts` |
| `payment_succeeded` | `app/api/webhooks/dodo/route.ts` |

## Next steps

To monitor user behavior, create an **"Analytics basics"** dashboard in PostHog at https://us.posthog.com/project/384527/dashboards with these recommended insights:

1. **Chatbot creation funnel** — Funnel: `chatbot_creation_started` → `chatbot_creation_completed`
2. **Checkout conversion funnel** — Funnel: `checkout_initiated` → `checkout_session_created` → `payment_succeeded`
3. **Messages sent over time** — Trend: `message_sent` (daily volume)
4. **Chatbot deletion rate** — Trend: `chatbot_deleted` vs `chatbot_creation_completed`
5. **AI model popularity** — Breakdown of `ai_model_selected` by `model` property

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
