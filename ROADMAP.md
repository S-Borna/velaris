# ROADMAP — Velaris Backend Implementation

> **Owner:** Said Borna  
> **Created:** 2026-03-07  
> **Status:** Planning — awaiting approval before implementation  

---

## Current State

The frontend is **complete** — all 19 routes built, all UI pages functional with mock data.  
The database schema is **complete** — all Prisma models exist with correct relations.  
The backend is **empty** — no API routes (beyond auth), no service logic, no third-party integrations.

---

## Implementation Points (5 phases, sequential)

### Point 1: AI Content Generation

**Goal:** Replace mock content generation with real Claude API calls.

| What | Details |
|------|---------|
| Package | `@anthropic-ai/sdk` |
| Backend | `lib/ai/content-generator.ts` — Claude API wrapper with prompt engineering |
| API Route | `app/api/content/generate/route.ts` — POST endpoint, Zod-validated input |
| Frontend | Wire `content/assistant/page.tsx` to call real API instead of `MOCK_GENERATED` |
| DB | Save generated content to `ContentPost` model |
| Env | `ANTHROPIC_API_KEY` (already in .env.example) |
| Effort | ~1 day |
| Risk | Low — straightforward API integration |

**Acceptance criteria:**
- [ ] User fills out form (category, topic, audience, language, tone)
- [ ] "Generate Content" calls Claude API and streams/returns real LinkedIn post content
- [ ] Multiple variants generated per request
- [ ] Content saved to database
- [ ] Error handling for API failures, rate limits, invalid API key

---

### Point 2: ICP Scoring

**Goal:** AI-powered lead qualification — Claude analyzes lead profiles against ICP criteria and returns a match score.

| What | Details |
|------|---------|
| Package | `@anthropic-ai/sdk` (already installed from Point 1) |
| Backend | `lib/ai/icp-scorer.ts` — Claude API wrapper for lead evaluation |
| API Route | `app/api/icp/score/route.ts` — POST endpoint, accepts lead data + ICP description |
| Frontend | Wire sequence builder ICP condition node + lead database ICP scores |
| DB | Write scores to `Lead.icpScore`, save config to `IcpConfig` |
| Effort | ~1 day |
| Risk | Low — same Claude API pattern as Point 1 |

**Acceptance criteria:**
- [ ] User writes ICP description ("Europe-based SaaS founder/CEO with 2-15 employees")
- [ ] System sends lead profile data to Claude for scoring (0-100)
- [ ] Scores saved to database and visible in lead table
- [ ] Batch scoring supported (score multiple leads at once)
- [ ] "Test Lead Scores" preview works in sequence builder

---

### Point 3: Scheduling / Workers (BullMQ + Redis)

**Goal:** Background job infrastructure for campaign execution, lead enrichment, and content scheduling.

| What | Details |
|------|---------|
| Packages | `bullmq`, `ioredis` |
| Backend | `lib/queue/connection.ts` — Redis connection singleton |
|  | `lib/queue/queues.ts` — Queue definitions (campaign, enrichment, content) |
|  | `workers/campaign-executor.ts` — Processes campaign sequence steps |
|  | `workers/content-scheduler.ts` — Posts scheduled content |
| API Routes | `app/api/campaigns/[id]/start/route.ts` — Enqueue campaign |
|  | `app/api/campaigns/[id]/pause/route.ts` — Pause campaign |
| Env | `REDIS_URL` (already in .env.example) |
| Effort | ~2 days |
| Risk | Medium — requires Redis instance (Railway or local) |

**Acceptance criteria:**
- [ ] Redis connection established and health-checked
- [ ] Campaign start/pause enqueues/dequeues jobs
- [ ] Campaign executor processes sequence steps (using mock LinkedIn adapter initially)
- [ ] Content scheduler publishes posts at scheduled times
- [ ] Failed jobs retry with exponential backoff
- [ ] Job status visible via API (for future dashboard)

**Dependency:** LinkedIn Adapter interface needed (built as mock in this phase, real in Point 5)

---

### Point 4: Lead Enrichment

**Goal:** Enrich lead profiles with real data from a third-party provider.

| What | Details |
|------|---------|
| Provider | People Data Labs (best coverage + pricing for startup) |
| Package | `peopledatalabs` (or direct REST API calls) |
| Backend | `lib/enrichment/provider.ts` — PDL API wrapper |
|  | `lib/enrichment/enrich-lead.ts` — Enrichment orchestrator |
| API Route | `app/api/leads/enrich/route.ts` — POST endpoint for single/batch enrichment |
| Worker | `workers/lead-enricher.ts` — Background enrichment via BullMQ |
| DB | Update `Lead` fields (email, phone, company data) + set `enrichmentStatus` |
| Env | `PDL_API_KEY` (new) |
| Effort | ~1-2 days |
| Risk | Medium — requires PDL API key + credits (paid service) |

**Acceptance criteria:**
- [ ] Single lead enrichment via API call
- [ ] Batch enrichment via background worker
- [ ] Enriched data reflected in lead table UI
- [ ] `enrichmentStatus` field updated (pending → enriched / failed)
- [ ] Cost-aware: skip already-enriched leads
- [ ] Graceful fallback when API key not set (show mock data + warning)

**Note:** Without a PDL API key, this point will include the full integration code with a graceful mock fallback. Real data flows when the key is configured.

---

### Point 5: LinkedIn Automation Engine

**Goal:** Real browser-based LinkedIn automation — campaign execution, inbound monitoring, inbox sync.

| What | Details |
|------|---------|
| Package | `playwright` (or `playwright-core` + Chromium) |
| Backend | `lib/linkedin/adapter.ts` — Interface definition |
|  | `lib/linkedin/mock-adapter.ts` — Simulator with realistic delays |
|  | `lib/linkedin/playwright-adapter.ts` — Real browser automation |
|  | `lib/linkedin/session-manager.ts` — Cookie/session management |
|  | `lib/linkedin/anti-detection.ts` — Fingerprint randomization, human delays |
| API Routes | `app/api/linkedin/connect/route.ts` — Connect LinkedIn account |
|  | `app/api/linkedin/messages/route.ts` — Fetch/send messages |
|  | `app/api/linkedin/actions/route.ts` — View profile, like, connect |
| Workers | Campaign executor (from Point 3) uses LinkedIn adapter |
| Effort | ~3-5 days |
| Risk | **HIGH** — Breaks LinkedIn ToS, risk for account restrictions/bans |

**Acceptance criteria:**
- [ ] `LinkedInAdapter` interface fully implemented (connect, sendConnection, sendMessage, viewProfile, likePost, extractLeads, getMessages)
- [ ] Mock adapter works for all action types with realistic delays
- [ ] Playwright adapter connects via session cookie
- [ ] Anti-detection measures (random delays, human-like mouse movement, fingerprint spoofing)
- [ ] Campaign executor drives sequences through adapter
- [ ] Daily limit enforcement per account
- [ ] Inbound automation: monitor posts for keywords, auto-comment, auto-DM
- [ ] Unibox: fetch real messages from LinkedIn inbox

**Important caveats:**
- This violates LinkedIn's Terms of Service
- Accounts may get restricted or banned
- Anti-detection is a cat-and-mouse game — no guarantee of safety
- Recommend starting with mock adapter for demo, playwright for brave users

---

## Build Order & Dependencies

```
Point 1: AI Content Generation  (independent, start here)
    ↓
Point 2: ICP Scoring            (reuses Anthropic SDK from Point 1)
    ↓
Point 3: Scheduling / Workers   (independent, but enriches Points 1-2)
    ↓
Point 4: Lead Enrichment        (uses worker queue from Point 3)
    ↓
Point 5: LinkedIn Automation    (uses workers from Point 3, mock→real adapter)
```

---

## Risk Matrix

| Point | Technical Risk | Legal Risk | Cost |
|-------|---------------|------------|------|
| 1. AI Content | Low | None | Claude API usage (~$0.01/request) |
| 2. ICP Scoring | Low | None | Claude API usage (~$0.02/lead) |
| 3. Scheduling | Medium | None | Redis hosting (~$5/mo Railway) |
| 4. Lead Enrichment | Medium | None | PDL credits (~$0.10/lead) |
| 5. LinkedIn Automation | High | **ToS violation** | Playwright compute + ban risk |

---

## Status Tracker

| Point | Status | Started | Completed | Commit |
|-------|--------|---------|-----------|--------|
| 1. AI Content Generation | ⬜ Not started | | | |
| 2. ICP Scoring | ⬜ Not started | | | |
| 3. Scheduling / Workers | ⬜ Not started | | | |
| 4. Lead Enrichment | ⬜ Not started | | | |
| 5. LinkedIn Automation | ⬜ Not started | | | |
