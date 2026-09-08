'use client';

import { useMemo } from 'react';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  Cloud2Outlined,
  CloudUploadOutlined,
  Database2Outlined,
  Globe1Outlined,
  GithubOutlined,
  GoogleDriveOutlined,
  NotionOutlined,
  RefreshCircle1ClockwiseOutlined,
  SlackOutlined,
  WebhooksOutlined,
} from '@lineiconshq/free-icons';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  Fact,
  FutureTile,
  Hairline,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  RowHead,
  RowList,
  StatusPill,
  exact,
  plural,
} from '@/components/dashboard/kit';
import type { TrainingPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Knowledge  ·  /index
   --------------------------------------------------------------------------
   Renamed from "Training & Data", which described what we do to the model
   rather than what the customer owns. The screen answers one question — what
   can this bot answer from? — and answers it with the customer's own URLs,
   because that is the product's raw material.

   Everything below the source list is a placeholder for an integration that
   does not exist yet. It is drawn honestly: dashed, dimmed, labelled Planned,
   and never clickable. Nothing here calls an API that isn't already wired.
   ========================================================================== */

function hostOf(raw: unknown): string {
  const value = String(raw ?? '');
  if (!value) return '';
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`).host.replace(/^www\./, '');
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function when(raw: unknown): string {
  const value = raw ? new Date(String(raw)) : null;
  if (!value || Number.isNaN(value.getTime())) return '—';
  return value.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Integrations we intend to build. Order is by how often customers ask. */
const PLANNED = [
  { icon: NotionOutlined, name: 'Notion', note: 'Sync a workspace or a single database' },
  { icon: GoogleDriveOutlined, name: 'Google Drive', note: 'Docs and PDFs from a shared folder' },
  { icon: SlackOutlined, name: 'Slack', note: 'Answers from pinned messages and canvases' },
  { icon: GithubOutlined, name: 'GitHub', note: 'READMEs and docs from a repository' },
  { icon: WebhooksOutlined, name: 'Webhook', note: 'Push a page to the index when it changes' },
  { icon: Cloud2Outlined, name: 'Sitemap', note: 'Follow sitemap.xml and stay in step' },
];

export default function TrainingPage({ chatbot }: TrainingPageProps) {
  const host = hostOf(chatbot?.website_url ?? chatbot?.websiteUrl ?? chatbot?.url);
  const pages = chatbot?.pages_indexed ?? chatbot?.pagesIndexed ?? chatbot?.page_count ?? null;

  /* The API returns one crawled site today. Rendering it as a list of one is
     deliberate: the day a second source type ships, nothing about this screen
     has to move. */
  const sources = useMemo(() => {
    if (!host) return [];
    return [
      {
        id: 'site',
        kind: 'Website',
        icon: Globe1Outlined,
        label: host,
        detail: `${exact(pages)} ${plural(Number(pages) || 0, 'page')} read`,
        status: chatbot?.status ?? 'active',
        added: chatbot?.created_at ?? chatbot?.createdAt,
      },
    ];
  }, [host, pages, chatbot?.status, chatbot?.created_at, chatbot?.createdAt]);

  return (
    <>
      <PageHeader
        eyebrow="/index"
        title="Knowledge"
        description="Everything this chatbot is allowed to answer from. If a page is not in this list, the bot will say it does not know rather than guess."
        meta={
          <>
            <Fact label="sources" value={sources.length} />
            <Fact label="pages" value={exact(pages)} tone="signal" />
            <Fact label="last crawl" value={when(chatbot?.updated_at ?? chatbot?.updatedAt)} />
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => posthog.capture('training_recrawl_requested')}
            >
              <Lineicons
                icon={RefreshCircle1ClockwiseOutlined}
                size={14}
                aria-hidden="true"
                focusable="false"
              />
              Recrawl
            </Button>
            <Button size="sm" onClick={() => posthog.capture('training_website_added')}>
              Add source
            </Button>
          </>
        }
      />

      <Panel>
        <PanelHeader
          title="Sources"
          description="What has been read, and when it was last checked."
        />
        <PanelBody>
          {sources.length === 0 ? (
            <EmptyState
              icon={Database2Outlined}
              title="Nothing indexed yet"
              body="Point the bot at a site and it will read every page it can reach, then answer only from those pages."
              action={
                <Button size="sm" onClick={() => posthog.capture('training_website_added')}>
                  Add a website
                </Button>
              }
            />
          ) : (
            <>
              <RowHead className="grid-cols-[minmax(0,1fr)_7rem_6.5rem] sm:grid-cols-[minmax(0,1fr)_9rem_7rem_6.5rem]">
                <span>Source</span>
                <span className="hidden sm:block">Added</span>
                <span>Status</span>
                <span className="text-right">Type</span>
              </RowHead>
              <RowList>
                {sources.map((source) => (
                  <Row
                    key={source.id}
                    className="grid-cols-[minmax(0,1fr)_7rem_6.5rem] items-center sm:grid-cols-[minmax(0,1fr)_9rem_7rem_6.5rem]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2">
                        <Lineicons
                          icon={source.icon}
                          size={13}
                          className="text-muted-foreground"
                          aria-hidden="true"
                          focusable="false"
                        />
                      </span>
                      <span className="min-w-0">
                        <Mono className="block truncate">{source.label}</Mono>
                        <span className="block truncate tc-meta text-muted-foreground">
                          {source.detail}
                        </span>
                      </span>
                    </div>
                    <span className="tc-path hidden text-muted-foreground sm:block">
                      {when(source.added)}
                    </span>
                    <StatusPill status={source.status} />
                    <span className="tc-path text-right text-muted-foreground">{source.kind}</span>
                  </Row>
                ))}
              </RowList>
            </>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Add"
          title="Bring in more content"
          description="Two of these work today. The rest are on the roadmap and will appear in the list above once connected."
        />
        <PanelBody className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => posthog.capture('training_website_added')}
              className="tc-tile tc-lift flex items-start gap-3 p-4 text-left"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
                <Lineicons icon={Globe1Outlined} size={15} aria-hidden="true" focusable="false" />
              </span>
              <span className="min-w-0">
                <span className="block tc-label text-foreground">
                  Website
                </span>
                <span className="block tc-meta text-muted-foreground">
                  Crawl a domain and follow its internal links
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => posthog.capture('training_files_uploaded')}
              className="tc-tile tc-lift flex items-start gap-3 p-4 text-left"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2">
                <Lineicons
                  icon={CloudUploadOutlined}
                  size={15}
                  aria-hidden="true"
                  focusable="false"
                />
              </span>
              <span className="min-w-0">
                <span className="block tc-label text-foreground">
                  Files
                </span>
                <span className="block tc-meta text-muted-foreground">
                  PDF, Markdown, plain text or .docx
                </span>
              </span>
            </button>
          </div>

          <Hairline />

          <div>
            <p className="tc-eyebrow mb-3">Planned</p>
            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {PLANNED.map((item) => (
                <FutureTile
                  key={item.name}
                  icon={item.icon}
                  name={item.name}
                  note={item.note}
                />
              ))}
            </div>
          </div>
        </PanelBody>
      </Panel>
    </>
  );
}
