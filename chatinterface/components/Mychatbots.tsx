'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { Lineicons } from '@lineiconshq/react-lineicons';
import {
  BotpressOutlined,
  MenuMeatballs1Outlined,
  PlayOutlined,
  RefreshCircle1ClockwiseOutlined,
  Trash3Outlined,
} from '@lineiconshq/free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  EmptyState,
  Fact,
  Mono,
  PageHeader,
  Panel,
  PanelBody,
  Row,
  RowHead,
  RowList,
  RowsSkeleton,
  Segmented,
  StatusPill,
  Toolbar,
  compact,
  exact,
  plural,
} from '@/components/dashboard/kit';
import { hostOf, isLive, isWorking, shortDate } from '@/lib/insights';
import type { MyChatbotsPageProps } from '@/lib/types/ui';

/* ==========================================================================
   Chatbots  ·  /agents
   --------------------------------------------------------------------------
   This was a grid of gradient cards, one per chatbot, each repeating the same
   three labels — Status, Pages, Messages — beside its own value. Three cards
   in and you are reading labels, not data.

   A ledger inverts that: the labels are said once in the header row, the
   values line up in columns, and the eye can run down one column to compare.
   It also scales — the card grid was pleasant at three bots and unusable at
   thirty. The filter and search exist for the same reason.

   Deletion is unchanged in behaviour but no longer anonymous: the dialog
   names the chatbot you are about to lose.
   ========================================================================== */

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Answering' },
  { value: 'working', label: 'Indexing' },
] as const;

type FilterValue = (typeof FILTERS)[number]['value'];

const COLS =
  'grid-cols-[minmax(0,1fr)_6.5rem_2rem] sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_5.5rem_6rem_2rem]';

export default function MyChatbotsPage({
  chatbots,
  loading,
  onSelectChatbot,
  onRefresh,
  canCreateChatbot,
  onCreateChatbot,
}: MyChatbotsPageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');
  const { data: session } = useSession();

  const rows = useMemo(() => (Array.isArray(chatbots) ? chatbots : []), [chatbots]);

  const doomed = useMemo(
    () => rows.find((bot) => String(bot?.id) === String(chatbotToDelete)) ?? null,
    [rows, chatbotToDelete],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((bot) => {
      if (filter === 'live' && !isLive(bot)) return false;
      if (filter === 'working' && !isWorking(bot)) return false;
      if (!needle) return true;
      return `${bot?.name ?? ''} ${hostOf(bot)}`.toLowerCase().includes(needle);
    });
  }, [rows, filter, query]);

  const liveCount = useMemo(
    () => rows.filter(isLive).length,
    [rows],
  );

  /* Unchanged: same endpoint, same event, same refresh. */
  const handleDelete = async () => {
    try {
      await fetch(`/api/chatbots/${chatbotToDelete}`, {
        method: 'DELETE',
      });
      posthog.capture('chatbot_deleted', {
        chatbot_id: chatbotToDelete,
        user_email: session?.user?.email,
      });
      toast.success('Chatbot deleted');
      onRefresh();
    } catch (error) {
      posthog.captureException(error);
      toast.error('Failed to delete chatbot');
    }
    setDeleteDialogOpen(false);
  };

  function open(bot: any) {
    posthog.capture('chatbot_selected', { chatbot_id: bot?.id, chatbot_name: bot?.name });
    onSelectChatbot(bot);
  }

  return (
    <>
      <PageHeader
        eyebrow="/agents"
        title="Chatbots"
        description="Every chatbot in this workspace, what it has read, and how much it is being asked."
        meta={
          <>
            <Fact label="total" value={exact(rows.length)} />
            <Fact label="answering" value={exact(liveCount)} />
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <Lineicons icon={RefreshCircle1ClockwiseOutlined} className="size-4" />
              Refresh
            </Button>
            <Button onClick={onCreateChatbot} disabled={!canCreateChatbot}>
              New chatbot
            </Button>
          </>
        }
      />

      {loading ? (
        <Panel>
          <PanelBody className="pt-5">
            <RowsSkeleton rows={4} />
          </PanelBody>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <PanelBody className="pt-5">
            <EmptyState
              icon={BotpressOutlined}
              title="No chatbots yet"
              body="A chatbot reads your site or your documents, then answers questions about them. Point one at a URL and it is live in a few minutes."
              action={
                <Button onClick={onCreateChatbot} disabled={!canCreateChatbot}>
                  Create your first chatbot
                </Button>
              }
              secondary={
                canCreateChatbot ? null : (
                  <span className="tc-meta text-muted-foreground">
                    Add credits to create a chatbot.
                  </span>
                )
              }
            />
          </PanelBody>
        </Panel>
      ) : (
        <Panel>
          <PanelBody className="space-y-0 px-3 pt-4 sm:px-4">
            <Toolbar count={`${exact(visible.length)} ${plural(visible.length, 'chatbot')}`}>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name or site…"
                className="h-8 w-full sm:w-56"
                aria-label="Filter chatbots"
              />
              <Segmented
                size="sm"
                value={filter}
                onChange={(next) => setFilter(next as FilterValue)}
                options={FILTERS.map((item) => ({ value: item.value, label: item.label }))}
              />
            </Toolbar>

            {visible.length === 0 ? (
              <div className="pb-2">
                <EmptyState
                  icon={BotpressOutlined}
                  title="Nothing matches"
                  body="No chatbot in this workspace matches that filter. Clear it to see all of them again."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery('');
                        setFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <RowHead className={COLS}>
                  <span>Chatbot</span>
                  <span>Status</span>
                  <span className="hidden text-right sm:block">Pages</span>
                  <span className="hidden text-right sm:block">Messages</span>
                  <span className="hidden text-right sm:block">Updated</span>
                  <span className="sr-only">Actions</span>
                </RowHead>
                <RowList>
                  {visible.map((bot) => (
                    <Row key={bot?.id} className={`${COLS} items-center`}>
                      <button
                        type="button"
                        onClick={() => open(bot)}
                        className="min-w-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <span className="block truncate tc-label text-foreground group-hover:text-signal">
                          {bot?.name || 'Untitled chatbot'}
                        </span>
                        <span className="mt-0.5 block truncate tc-micro text-muted-foreground">
                          {hostOf(bot) || 'no source yet'}
                        </span>
                      </button>
                      <span>
                        <StatusPill status={bot?.status} />
                      </span>
                      <Mono className="hidden text-right sm:block">
                        {compact(Number(bot?.pagesScraped) || 0)}
                      </Mono>
                      <Mono className="hidden text-right sm:block">
                        {compact(Number(bot?.monthlyMessages) || 0)}
                      </Mono>
                      <Mono className="hidden text-right sm:block">{shortDate(bot?.lastUpdated)}</Mono>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Actions for ${bot?.name || 'chatbot'}`}
                          >
                            <Lineicons icon={MenuMeatballs1Outlined} className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => open(bot)}>
                            <Lineicons icon={PlayOutlined} className="size-4" />
                            Open in playground
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setChatbotToDelete(bot?.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Lineicons icon={Trash3Outlined} className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Row>
                  ))}
                </RowList>
              </>
            )}
          </PanelBody>
        </Panel>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chatbot?</DialogTitle>
            <DialogDescription>
              {doomed?.name ? (
                <>
                  <span className="font-medium text-foreground">{doomed.name}</span> and everything
                  it has read will be removed. Conversations already logged against it go too. This
                  cannot be undone.
                </>
              ) : (
                'This chatbot and everything it has read will be removed. This cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete chatbot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
