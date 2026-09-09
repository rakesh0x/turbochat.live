/* ==========================================================================
   First run  ·  the shape of the answers
   --------------------------------------------------------------------------
   One module, imported by every onboarding step and by the orchestrator, so
   the flow has exactly one definition of what is being collected, one place
   that decides whether a step is answerable yet, and one place that reads and
   writes it.

   Two honesty constraints shaped this file:

   · There is no endpoint that stores a survey. `POST /api/chatbot/create`
     takes `{ name, website, limit }` and nothing else. So the answers that
     the API can act on — name, website, page budget — are applied for real,
     and the rest is kept locally and sent to product analytics. The last
     step says which is which rather than implying we filed it all somewhere.

   · A returning customer must never be walked through this again. The
     marker below is the only thing that grants a skip, and it is written
     the moment a chatbot exists — not when someone reaches the last screen.
   ========================================================================== */

export type StepId = 'purpose' | 'source' | 'shape' | 'channels' | 'discovery' | 'build';

/** In order. The orchestrator walks this; nothing else should hardcode a step. */
export const STEP_ORDER: readonly StepId[] = [
  'purpose',
  'source',
  'shape',
  'channels',
  'discovery',
  'build',
] as const;

/** Everything the flow collects. Serialisable on purpose — see `saveDraft`. */
export type Draft = {
  /** Preset id from step 1, e.g. `support`. */
  purpose: string | null;
  /** Free text: the problem in the customer's own words. */
  problem: string;
  website: string;
  crawlLimit: number;
  agentName: string;
  /** Preset id from step 3, e.g. `plain`. */
  tone: string | null;
  /** The drafted instruction paragraph. Not sent — no endpoint accepts it. */
  instructions: string;
  /** Where they want it to answer. Ids only; none of these connect yet. */
  channels: string[];
  /** Tools they already run. Ids only. */
  tools: string[];
  discovery: string | null;
  discoveryDetail: string;
};

export const EMPTY_DRAFT: Draft = {
  purpose: null,
  problem: '',
  website: '',
  crawlLimit: 10,
  agentName: '',
  tone: null,
  instructions: '',
  channels: [],
  tools: [],
  discovery: null,
  discoveryDetail: '',
};

/** What every step component receives. No step reaches outside this. */
export type StepProps = {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
  next: () => void;
  back: () => void;
};

/* ---- the website, read charitably ---------------------------------------
   People paste `acme.com`, `www.acme.com/`, and `https://acme.com/pricing`.
   All three are the same answer, and none of them should be rejected. */

export function hostOf(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).host.replace(
      /^www\./,
      '',
    );
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }
}

/** A host is plausible when it has a dot, no spaces, and a real-looking TLD. */
export function isPlausibleSite(raw: string): boolean {
  const host = hostOf(raw);
  if (!host || /\s/.test(host)) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(
    host,
  );
}

/** `https://acme.com` — what the create call wants. */
export function normalizeSite(raw: string): string {
  const host = hostOf(raw);
  return host ? `https://${host}` : '';
}

/** A default name, so nobody has to invent one to get past step 2. */
export function suggestName(raw: string): string {
  const host = hostOf(raw);
  if (!host) return '';
  const label = host.split('.')[0].replace(/[-_]+/g, ' ').trim();
  if (!label) return '';
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} assistant`;
}

/* ---- gating -------------------------------------------------------------
   Continue is disabled, never silently inert. A step that cannot be answered
   wrong does not gate: the two survey steps let you pass without picking,
   because guessing to unblock yourself pollutes the answer. */

export function canAdvance(step: StepId, draft: Draft): boolean {
  switch (step) {
    case 'purpose':
      return draft.purpose !== null;
    case 'source':
      return isPlausibleSite(draft.website) && draft.agentName.trim().length > 0;
    case 'shape':
      return draft.tone !== null;
    case 'channels':
    case 'discovery':
      return true;
    case 'build':
      return false;
    default:
      return true;
  }
}

/* ---- persistence --------------------------------------------------------
   Local only. A refresh mid-crawl must not lose four answered questions, and
   nothing here is worth a server round trip. */

const DRAFT_KEY = 'turbochat.onboarding.v1.draft';
const DONE_KEY = 'turbochat.onboarding.v1.done';
const STEP_KEY = 'turbochat.onboarding.v1.step';

function canStore(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function loadDraft(): Draft {
  if (!canStore()) return EMPTY_DRAFT;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_DRAFT, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: Draft): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Private mode, or a full quota. Losing a draft is not worth a crash. */
  }
}

export function loadStep(): StepId | null {
  if (!canStore()) return null;
  const raw = window.localStorage.getItem(STEP_KEY);
  return STEP_ORDER.includes(raw as StepId) ? (raw as StepId) : null;
}

export function saveStep(step: StepId): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(STEP_KEY, step);
  } catch {
    /* see saveDraft */
  }
}

/* Two ways out of first run, and they are not the same thing.

   `resolveFirstRun` says "stop sending this person here automatically" and is
   what a skip does — it keeps the draft, because someone who skips today may
   come back through the console's own New chatbot button tomorrow and should
   not retype four answers.

   `markOnboarded` is the finished case: a chatbot exists, so the draft is
   spent and can go. */
export function resolveFirstRun(): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(DONE_KEY, new Date().toISOString());
  } catch {
    /* see saveDraft */
  }
}

export function markOnboarded(): void {
  resolveFirstRun();
  if (!canStore()) return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.localStorage.removeItem(STEP_KEY);
  } catch {
    /* see saveDraft */
  }
}

export function isOnboarded(): boolean {
  if (!canStore()) return false;
  return !!window.localStorage.getItem(DONE_KEY);
}
