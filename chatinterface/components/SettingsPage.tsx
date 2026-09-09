'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import posthog from 'posthog-js';
import { toast } from 'sonner';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  Brush2Outlined,
  Gear1Outlined,
  Globe1Outlined,
  Message2Outlined,
  SlidersHorizontalSquare2Outlined,
  Trash3Outlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EmptyState,
  Fact,
  Field,
  FormSection,
  FutureTile,
  KeyValue,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
  ToggleRow,
  exact,
  plural,
} from '@/components/dashboard/kit';
import type { SettingsPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Settings  ·  /configure
   --------------------------------------------------------------------------
   The old version of this screen was a form that could not save. Two inputs
   bound with `defaultValue`, a model select whose three options (GPT-4,
   GPT-3.5, Claude 3) were literals no endpoint has ever accepted, and a red
   Delete button with no handler at all. Pressing Save fired one analytics
   event and nothing else.

   The API is unchanged, so the behaviour is unchanged: there is no PATCH for
   a chatbot, and deletion belongs to the Chatbots screen, which owns both the
   DELETE call and the confirmation. What changed is that the screen now says
   so. The one field you can genuinely edit is a draft and is labelled as one;
   every value the API actually controls is read-only; everything that would
   need server work is dashed, dimmed and marked planned rather than drawn as
   a control that quietly does nothing.
   ========================================================================== */

/* Two shapes the kit does not carry. They stay local because kit.tsx is
   shared and neither has earned a second caller yet. */

/** A quiet mono chip: why a control is not yours to change. */
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="tc-path rounded-full border border-border bg-surface-2 px-1.5 py-px font-normal text-muted-foreground">
      {children}
    </span>
  );
}

/** The paragraph that keeps this screen honest. One per view. */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="tc-inset max-w-3xl px-4 py-3 tc-body text-muted-foreground">
      {children}
    </p>
  );
}

/** A date the record really carried. The API stringifies nulls, so guard. */
function when(raw: unknown): string {
  const value = raw ? new Date(String(raw)) : null;
  if (!value || Number.isNaN(value.getTime())) return '—';
  return value.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SettingsPage({ chatbot }: SettingsPageProps) {
  const botKey = String(chatbot?.id ?? '');
  const serverName = String(chatbot?.name ?? '');

  /* One editable field, and it resets the moment a different bot is selected.
     The old `defaultValue` inputs kept whatever you had typed while the header
     switched to another chatbot, so a stale name sat in the box looking like
     an unsaved edit to a bot you had never opened. */
  const [draft, setDraft] = useState({ key: botKey, name: serverName });
  if (draft.key !== botKey) setDraft({ key: botKey, name: serverName });

  const website = String(
    chatbot?.website ?? chatbot?.website_url ?? chatbot?.websiteUrl ?? chatbot?.url ?? '',
  );
  const model = String(chatbot?.model ?? '').trim();
  const pages = chatbot?.pagesScraped ?? chatbot?.pages_scraped ?? null;
  const messages = chatbot?.monthlyMessages ?? chatbot?.monthly_messages ?? null;
  const isPublic = Boolean(chatbot?.isPublic ?? chatbot?.is_public);
  const dirty = draft.name !== serverName;

  const pagesLabel =
    pages === null || pages === undefined
      ? '—'
      : `${exact(pages)} ${plural(Number(pages) || 0, 'page')}`;

  if (!chatbot) {
    return (
      <>
        <PageHeader
          eyebrow="/configure"
          title="Settings"
          description="Settings belong to one chatbot: what it is called, the site it answers from, and how it is allowed to answer."
        />
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={Gear1Outlined}
              title="No chatbot selected"
              body="Pick a chatbot from the switcher at the top of the sidebar, or create one first. There is nothing to configure until then — and an empty form would only invite you to fill it in."
            />
          </PanelBody>
        </Panel>
      </>
    );
  }

  /* Unchanged on purpose: the same event name, the same properties, and still
     no persistence, because no endpoint accepts one. The toast says that out
     loud instead of flashing a green "Saved". */
  function save() {
    posthog.capture('chatbot_settings_saved', {
      chatbot_id: chatbot.id,
      chatbot_name: chatbot.name,
    });
    toast('Noted — not saved to the server', {
      description:
        'Turbochat has no settings endpoint yet, so this name stays on this screen. The request was recorded so we know it is wanted.',
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="/configure"
        title="Settings"
        description="What this chatbot is called, what answers on its behalf, and what cannot be undone. Anything you can type here is a draft; anything read-only is a value the API owns."
        meta={
          <>
            <Fact label="chatbot" value={serverName || '—'} />
            <Fact label="model" value={model || '—'} tone="signal" />
            <Fact label="updated" value={when(chatbot?.lastUpdated)} />
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty}
              onClick={() => setDraft({ key: botKey, name: serverName })}
            >
              Reset
            </Button>
            <Button size="sm" disabled={!dirty} onClick={save}>
              Save changes
            </Button>
          </>
        }
      />

      <Notice>
        Nothing on this screen writes to your chatbot yet — there is no settings
        endpoint behind it. Saving records the change so we know to build it, and
        the draft is gone on reload. Every value the API does control is shown
        read-only below.
      </Notice>

      <FormSection
        title="General"
        description="How this chatbot is identified — in the widget, in the sidebar switcher, and in your own records."
      >
        <Field
          label="Chatbot name"
          htmlFor="tc-settings-name"
          hint="Shown in the widget header and in the switcher at the top of the sidebar."
          className="max-w-xl"
        >
          <Input
            id="tc-settings-name"
            value={draft.name}
            onChange={(event) => setDraft({ key: botKey, name: event.target.value })}
            placeholder={serverName || 'Untitled chatbot'}
            autoComplete="off"
          />
        </Field>

        <Field
          label={
            <span className="flex items-center gap-2">
              Source website <Tag>crawled</Tag>
            </span>
          }
          htmlFor="tc-settings-site"
          hint="Fixed when the chatbot was created. To change what it can answer from, add or recrawl a source under Knowledge."
          className="max-w-xl"
        >
          <Input
            id="tc-settings-site"
            value={website || '—'}
            readOnly
            aria-readonly="true"
            className="bg-surface-2 tc-path text-muted-foreground"
          />
        </Field>

        <div className="max-w-xl">
          <p className="tc-eyebrow mb-2">Record</p>
          <KeyValue
            items={[
              { label: 'Chatbot id', value: botKey || '—' },
              { label: 'Status', value: <StatusPill status={chatbot?.status} />, mono: false },
              { label: 'Pages indexed', value: pagesLabel },
              { label: 'Messages this month', value: exact(messages) },
              { label: 'Created', value: when(chatbot?.createdAt) },
              { label: 'Last updated', value: when(chatbot?.lastUpdated) },
            ]}
          />
        </div>
      </FormSection>

      <FormSection
        title="Answering"
        description="The model behind the replies and the rules it follows. Both are set on the server today, so they are reported here rather than offered."
      >
        <Field
          label={
            <span className="flex items-center gap-2">
              Model <Tag>server-set</Tag>
            </span>
          }
          htmlFor="tc-settings-model"
          hint="Read back from the API. Every chatbot on the account runs this model; choosing one per chatbot is planned."
          className="max-w-xl"
        >
          {model ? (
            <Select value={model} disabled>
              <SelectTrigger
                id="tc-settings-model"
                className="w-full tc-path"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={model}>{model}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="tc-inset px-3 py-2 tc-path text-muted-foreground">
              — not reported by the API
            </p>
          )}
        </Field>

        <Field
          label={
            <span className="flex items-center gap-2">
              System prompt <Tag>planned</Tag>
            </span>
          }
          htmlFor="tc-settings-prompt"
          hint="The instruction is assembled per question on the server: answer from the indexed context, stay concise, and say when the pages do not cover it. Editing it needs server work."
          className="max-w-xl"
        >
          <Textarea
            id="tc-settings-prompt"
            rows={4}
            disabled
            placeholder="Answer only from the provided context. Be concise and factual. If the indexed pages do not cover the question, say so instead of guessing."
          />
        </Field>

        <div className="max-w-xl pt-1">
          <ToggleRow
            title="Answer only from indexed pages"
            description="Already how it works. The model is handed the crawled context and nothing else, so it says it does not know rather than filling the gap."
            control={
              <Switch checked disabled aria-label="Answer only from indexed pages" />
            }
          />
          <ToggleRow
            title={
              <span className="flex items-center gap-2">
                Cite the page an answer came from <Tag>planned</Tag>
              </span>
            }
            description="Show the source URL under a reply so a reader can check it."
            control={<Switch disabled aria-label="Cite the page an answer came from" />}
          />
          <ToggleRow
            title={
              <span className="flex items-center gap-2">
                Hand off to a human <Tag>planned</Tag>
              </span>
            }
            description="Offer an email address or a live agent when the indexed pages cannot answer."
            control={<Switch disabled aria-label="Hand off to a human" />}
          />
        </div>
      </FormSection>

      <Panel>
        <PanelHeader
          eyebrow="Roadmap"
          title="Not built yet"
          description="Asked for often enough to draw, honest enough to leave disabled. Each one needs a server change before it can appear as a real control above."
        />
        <PanelBody>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FutureTile
              icon={Message2Outlined}
              name="Welcome message"
              note="The first line the widget says, before anyone types"
            />
            <FutureTile
              icon={Brush2Outlined}
              name="Brand colour"
              note="Match the widget to your site instead of the default"
            />
            <FutureTile
              icon={SlidersHorizontalSquare2Outlined}
              name="Answer length"
              note="Ask for a sentence, a paragraph, or the full detail"
            />
            <FutureTile
              icon={Globe1Outlined}
              name="Reply language"
              note="Answer in the visitor's language, whatever the pages are in"
            />
          </div>
        </PanelBody>
      </Panel>

      <FormSection
        title="Danger zone"
        tone="danger"
        description="One-way actions. Deletion is real and already built — it simply does not live on this screen."
      >
        <div className="max-w-xl">
          <ToggleRow
            title="Delete this chatbot"
            description="Removes the bot, the pages crawled for it, and every conversation it has had. The Chatbots screen owns this, including the confirmation that names what you are about to lose — open it there."
            control={
              <Button variant="destructive" size="sm" disabled>
                <Lineicons icon={Trash3Outlined} size={14} aria-hidden="true" focusable="false" />
                Delete
              </Button>
            }
          />
          {isPublic ? (
            <ToggleRow
              title="Take the public page offline"
              description="This chatbot is answering publicly at its share link. Publishing and unpublishing both happen on the Deploy screen."
              control={<Tag>deploy</Tag>}
            />
          ) : null}
        </div>
      </FormSection>
    </>
  );
}
