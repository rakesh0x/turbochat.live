'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import posthog from 'posthog-js';
import { toast } from 'sonner';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  AppleBrandOutlined,
  CopyAiOutlined,
  DiscordOutlined,
  Download1Outlined,
  GithubOutlined,
  Globe1Outlined,
  Html5Outlined,
  Link2AngularRightOutlined,
  Rocket5Outlined,
  SlackOutlined,
  Spinner3Outlined,
  WebhooksOutlined,
  WhatsappOutlined,
  WordpressOutlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import {
  Bone,
  CopyField,
  EmptyState,
  ErrorState,
  Fact,
  FutureTile,
  Hairline,
  KeyValue,
  LiveTag,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  PanelSkeleton,
  StatusPill,
} from '@/components/dashboard/kit';
import type { DeployPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Deploy  ·  /embed
   --------------------------------------------------------------------------
   Two shipping routes, and the screen has to make the difference obvious: a
   script tag you paste into your own site, or a hosted page we serve for you.
   The old version buried both behind a tab strip labelled "HTML" and
   "Publish", which named the *artefact* rather than the decision.

   Nothing here claims to know whether the install worked. There is no ping
   from a customer's site back to us, so the Verify panel is a checklist the
   reader performs, not a green tick we invent. The channels at the bottom are
   drawn honestly: dashed, dimmed, labelled Planned, never clickable.
   ========================================================================== */

/* Channels we intend to build. Order is by how often customers ask. */
const PLANNED_CHANNELS = [
  { icon: SlackOutlined, name: 'Slack', note: 'Answer in a channel or a direct message' },
  { icon: WhatsappOutlined, name: 'WhatsApp', note: 'A business number on the same index' },
  { icon: DiscordOutlined, name: 'Discord', note: 'A bot user in your community server' },
  { icon: AppleBrandOutlined, name: 'iOS SDK', note: 'A native Swift view for your app' },
  { icon: WordpressOutlined, name: 'WordPress', note: 'A plugin, so no theme files to edit' },
  { icon: WebhooksOutlined, name: 'Webhook', note: 'Post a question, receive the answer' },
];

/** A numbered instruction list. The kit has no ordered-list primitive, and
    install steps are the one place on this screen where order is the point. */
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span
            aria-hidden="true"
            className="tc-num mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 tc-micro text-muted-foreground"
          >
            {index + 1}
          </span>
          <span className="min-w-0 tc-meta text-muted-foreground">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function DeployPage({ chatbot }: DeployPageProps) {
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isSharePublic, setIsSharePublic] = useState(false);
  const [host, setHost] = useState('');
  /* Presentational only: the fetch below was already best-effort, this just
     lets the panel say "loading" and "that request failed" out loud. */
  const [shareStatus, setShareStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  const loadShareState = useCallback(async () => {
    if (!chatbot?.id) {
      setShareStatus('ready');
      return;
    }
    setShareStatus('loading');
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share`);
      if (!response.ok) {
        setShareStatus('error');
        return;
      }
      const data = await response.json();
      setShareSlug(data?.shareSlug || null);
      setIsSharePublic(Boolean(data?.isPublic));
      setShareStatus('ready');
    } catch {
      // best-effort share status load
      setShareStatus('error');
    }
  }, [chatbot?.id]);

  useEffect(() => {
    loadShareState();
  }, [loadShareState]);

  const reliableHost = host.replace('localhost', '127.0.0.1');
  const hostedShareUrl = shareSlug ? `${host}/share/${shareSlug}` : '';

  const handleCopy = (code: string): void => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const handlePublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/publish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to publish hosted page');
      setShareSlug(data?.shareSlug || null);
      setIsSharePublic(true);
      posthog.capture("chatbot_published", {
        chatbot_id: chatbot?.id,
        chatbot_name: chatbot?.name,
        share_slug: data?.shareSlug,
      })
      toast.success('Hosted chatbot page published');
    } catch (error: any) {
      posthog.captureException(error)
      toast.error(error?.message || 'Failed to publish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnpublishHosted = async () => {
    if (!chatbot?.id) return;
    setShareLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/share/unpublish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || 'Failed to unpublish hosted page');
      setIsSharePublic(false);
      posthog.capture("chatbot_unpublished", {
        chatbot_id: chatbot?.id,
        chatbot_name: chatbot?.name,
      })
      toast.success('Hosted chatbot page unpublished');
    } catch (error: any) {
      posthog.captureException(error)
      toast.error(error?.message || 'Failed to unpublish hosted page');
    } finally {
      setShareLoading(false);
    }
  };

  if (!chatbot) {
    return (
      <>
        <PageHeader
          eyebrow="/embed"
          title="Deploy"
          description="Put a chatbot on your own site with one script tag, or hand out a hosted page that needs no site at all."
        />
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={Rocket5Outlined}
              title="No chatbot selected"
              body="Choose a chatbot from the switcher and its embed snippet, public link and install checks appear here."
            />
          </PanelBody>
        </Panel>
      </>
    );
  }

  const displayHost = host.replace(/^https?:\/\//, '');

  /* The one snippet a customer pastes. Built from the same two values the
     downloadable files below are built from, so the three cannot drift. */
  const embedSnippet = [
    `<script src="${reliableHost}/widget.js"></script>`,
    '<script>',
    "  window.addEventListener('load', function () {",
    '    ChatbotWidget.init({',
    `      chatbotId: "${chatbot.id}",`,
    `      apiUrl: "${reliableHost}/api"`,
    '    });',
    '  });',
    '</script>',
  ].join('\n');

  /* What a support thread actually needs, in one paste. */
  const installDetails = [
    `chatbot: ${chatbot.name ?? '—'}`,
    `chatbotId: ${chatbot.id ?? '—'}`,
    `widget: ${reliableHost}/widget.js`,
    `apiUrl: ${reliableHost}/api`,
    `hostedPage: ${isSharePublic && hostedShareUrl ? hostedShareUrl : 'not published'}`,
  ].join('\n');

  return (
    <>
      <PageHeader
        eyebrow="/embed"
        title="Deploy"
        description="Two ways to ship this bot: a script tag on your own site, or a hosted page we serve for you. Both answer from the same index."
        meta={
          <>
            <Fact
              label="state"
              value={isSharePublic ? 'published' : 'draft'}
              tone={isSharePublic ? 'signal' : 'quiet'}
            />
            <Fact label="bot" value={chatbot.name ?? '—'} />
            <Fact label="host" value={displayHost || '—'} />
          </>
        }
        actions={
          <Button onClick={handlePublishHosted} disabled={shareLoading}>
            <Lineicons
              icon={shareLoading ? Spinner3Outlined : Globe1Outlined}
              size={14}
              className={shareLoading ? 'animate-spin' : undefined}
              aria-hidden="true"
              focusable="false"
            />
            {isSharePublic ? 'Republish page' : 'Publish page'}
          </Button>
        }
      />

      {shareStatus === 'loading' ? (
        <PanelSkeleton bodyHeight="h-24" />
      ) : shareStatus === 'error' ? (
        <Panel>
          <PanelHeader eyebrow="Hosted page" title="Publish status" />
          <PanelBody>
            <ErrorState
              title="Could not read the publish status"
              body="The hosted page may well still be live — we simply could not check. Nothing was changed."
              onRetry={loadShareState}
            />
          </PanelBody>
        </Panel>
      ) : (
        <Panel>
          <PanelHeader
            eyebrow="Hosted page"
            title={isSharePublic ? 'Live for anyone with the link' : 'Not published'}
            description={
              isSharePublic
                ? 'We serve this page for you. No site to edit, no snippet, no deploy.'
                : 'Publishing mints a public URL that opens straight into this chatbot. Nothing is reachable until you publish.'
            }
            action={isSharePublic ? <LiveTag /> : <StatusPill status="draft" />}
          />
          <PanelBody>
            {hostedShareUrl ? (
              <CopyField value={hostedShareUrl} label="Public link" />
            ) : (
              <p className="tc-inset px-3.5 py-3 tc-meta text-muted-foreground">
                No link has been minted for this chatbot yet. Publish once and the URL stays the
                same from then on.
              </p>
            )}
          </PanelBody>
          <PanelFooter className="justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => hostedShareUrl && window.open(hostedShareUrl, '_blank', 'noopener,noreferrer')}
              disabled={!hostedShareUrl || !isSharePublic}
            >
              <Lineicons
                icon={Link2AngularRightOutlined}
                size={14}
                aria-hidden="true"
                focusable="false"
              />
              Open live page
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-danger hover:border-danger-border hover:bg-danger-soft hover:text-danger"
              onClick={handleUnpublishHosted}
              disabled={shareLoading || !isSharePublic}
            >
              Unpublish
            </Button>
          </PanelFooter>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          eyebrow="Install"
          title="One script tag on your own site"
          description="Works anywhere you can edit HTML — plain HTML, Next.js, WordPress, Webflow, Shopify."
          action={<Mono className="text-muted-foreground">widget.js</Mono>}
        />
        <PanelBody className="space-y-6">
          {host ? (
            <CopyField value={embedSnippet} label="Embed snippet" multiline />
          ) : (
            <Bone className="h-36 w-full" />
          )}

          <Steps
            items={[
              'Copy the snippet above.',
              <>
                Paste it immediately before the closing <Mono>{'</body>'}</Mono> tag, on every page
                that should offer the bot.
              </>,
              'Deploy your site. The launcher appears in the bottom-right corner.',
            ]}
          />

          <Hairline />

          <div>
            <p className="tc-eyebrow mb-3">Or take the files</p>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="tc-tile flex flex-col gap-3 p-4">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2">
                  <Lineicons
                    icon={GithubOutlined}
                    size={15}
                    className="text-muted-foreground"
                    aria-hidden="true"
                    focusable="false"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="tc-label text-foreground">
                    Repo bundle
                  </p>
                  <p className="mt-0.5 tc-meta text-muted-foreground">
                    A README and an index.html. Commit both, turn on GitHub Pages, and the bot is
                    hosted for free.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    posthog.capture("chatbot_embed_downloaded", {
                      chatbot_id: chatbot?.id,
                      chatbot_name: chatbot?.name,
                      download_type: "github_repo_bundle",
                    })
                    const blob = new Blob([`# My Chatbot: ${chatbot.name}

This repository contains my AI Chatbot frontend, powered by [ChatBot AI RAG-as-a-Service].

## Deployment
1. Upload to GitHub.
2. Enable GitHub Pages.
3. Your bot is live!
`], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'README.md';
                    a.click();

                    // Also trigger the HTML download
                    setTimeout(() => {
                      const htmlBlob = new Blob([`<!DOCTYPE html><html><head><title>${chatbot.name}</title></head><body><script src="${reliableHost}/widget.js"></script><script>window.addEventListener('load', function(){ChatbotWidget.init({chatbotId: "${chatbot.id}", apiUrl: "${reliableHost}/api"});});</script></body></html>`], { type: 'text/html' });
                      const htmlUrl = window.URL.createObjectURL(htmlBlob);
                      const htmlA = document.createElement('a');
                      htmlA.href = htmlUrl;
                      htmlA.download = 'index.html';
                      htmlA.click();
                    }, 500);
                  }}>
                  <Lineicons icon={Download1Outlined} size={14} aria-hidden="true" focusable="false" />
                  Download bundle
                </Button>
              </div>

              <div className="tc-tile flex flex-col gap-3 p-4">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2">
                  <Lineicons
                    icon={Html5Outlined}
                    size={15}
                    className="text-muted-foreground"
                    aria-hidden="true"
                    focusable="false"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="tc-label text-foreground">
                    Single page
                  </p>
                  <p className="mt-0.5 tc-meta text-muted-foreground">
                    One index.html with the page and the widget in it. Upload it anywhere static.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    posthog.capture("chatbot_embed_downloaded", {
                      chatbot_id: chatbot?.id,
                      chatbot_name: chatbot?.name,
                      download_type: "all_in_one_html",
                    })
                    const htmlBlob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatbot.name} - AI Chat</title>
    <style>
        body { margin: 0; font-family: system-ui; background: #000; color: #fff; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .hero { text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 0.5rem; }
        p { color: #888; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>${chatbot.name}</h1>
        <p>AI Assistant Powered by RAG-as-a-Service</p>
    </div>
    <script src="${reliableHost}/widget.js"></script>
    <script>
        window.addEventListener('load', function() {
            ChatbotWidget.init({
                chatbotId: "${chatbot.id}",
                apiUrl: "${reliableHost}/api"
            });
        });
    </script>
</body>
</html>`], { type: 'text/html' });
                    const htmlUrl = window.URL.createObjectURL(htmlBlob);
                    const htmlA = document.createElement('a');
                    htmlA.href = htmlUrl;
                    htmlA.download = 'index.html';
                    htmlA.click();
                  }}>
                  <Lineicons icon={Download1Outlined} size={14} aria-hidden="true" focusable="false" />
                  Export index.html
                </Button>
              </div>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Verify"
          title="Check that it landed"
          description="We cannot see your site, so nothing below is detected for you — there is no install ping back to us. These four checks take about a minute and catch the usual causes."
          action={
            <Button variant="outline" size="sm" onClick={() => handleCopy(installDetails)}>
              <Lineicons icon={CopyAiOutlined} size={14} aria-hidden="true" focusable="false" />
              Copy details
            </Button>
          }
        />
        <PanelBody className="space-y-6">
          <Steps
            items={[
              'Hard-reload the page you pasted the snippet into, so you are not reading cached HTML.',
              'Look for the launcher in the bottom-right corner.',
              <>
                If it is missing, open the browser console and confirm <Mono>widget.js</Mono> loaded
                — a 404 means the snippet is on a different domain than the one above.
              </>,
              'Ask the bot one question, then open Analytics: the message should be counted there.',
            ]}
          />

          <Hairline />

          <KeyValue
            items={[
              { label: 'Chatbot ID', value: chatbot.id ?? '—' },
              { label: 'Widget script', value: host ? `${reliableHost}/widget.js` : '—' },
              { label: 'API base', value: host ? `${reliableHost}/api` : '—' },
              {
                label: 'Hosted page',
                value: isSharePublic && hostedShareUrl ? hostedShareUrl : 'not published',
              },
            ]}
          />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Channels"
          title="Where else this bot could live"
          description="The widget and the hosted page are the only channels that work today. The rest are on the roadmap and will appear here — as real controls — once connected."
        />
        <PanelBody>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {PLANNED_CHANNELS.map((channel) => (
              <FutureTile
                key={channel.name}
                icon={channel.icon}
                name={channel.name}
                note={channel.note}
              />
            ))}
          </div>
        </PanelBody>
      </Panel>
    </>
  );
}
