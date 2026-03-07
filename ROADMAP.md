# ROADMAP — Velaris Full-Stack Implementation

> **Owner:** Said Borna  
> **Created:** 2026-03-07  
> **Updated:** 2026-03-07  
> **Directive:** Alla sidor bakom login ska vara fullt fungerande med riktig data. Inget lämnas åt slumpen.

---

## Project Status Overview

### What's Done

| Layer | Status | Details |
|-------|--------|---------|
| Frontend | ✅ Complete | 19 routes, all UI pages built, landing page, polish pass |
| Prisma Schema | ✅ Complete | 18 models, migration applied on Railway PostgreSQL |
| Auth | ✅ Complete | NextAuth + Credentials, signup creates user + workspace |
| Service Libraries | ✅ Complete | Claude AI, PDL enrichment, BullMQ queues, LinkedIn adapter |
| Deploy | ✅ Complete | Vercel (frontend) + Railway (PostgreSQL + Redis) |

### What's Missing (the gap)

**13 of 14 app pages are 100% MOCK.** The service libraries exist but:
- Zero Prisma queries exist for core entities (campaigns, leads, messages, etc.)
- Zero CRUD API routes exist (only auth + external service proxies)
- Zero frontend pages fetch from the database
- Only `api/auth/signup` writes to the database
- Only `content/assistant` partially calls a real API (Claude generation)

**The entire data layer between frontend ↔ database is missing.**

---

## Phase 2: Database-Backed Application (7 Blocks)

> **Rules:** Sequential execution. Each block is independently built, tested, committed, and checkpointed.  
> No batching. Maximum quality per block. Verify before commit.  
> **Excluded:** Stripe/billing (last polish step), Academy (stays static).

---

### Block 1: Service Layer (Prisma Query Helpers)

**Goal:** Create `lib/db/` with typed, workspace-scoped Prisma query functions for every entity.

**Files to create:**
| File | Entity | Key Functions |
|------|--------|---------------|
| `lib/db/campaigns.ts` | Campaign | list, getById, create, update, updateStatus, getStats |
| `lib/db/leads.ts` | Lead | list (filtered/paginated), getById, create, bulkCreate, update, updateIcpScore |
| `lib/db/campaign-leads.ts` | CampaignLead | list, assign, updateStatus, getNextActions |
| `lib/db/sequences.ts` | Sequence | listByCampaign, create, update, reorder, delete |
| `lib/db/linkedin-accounts.ts` | LinkedinAccount | list, getById, create, update, updateUsage, updateStatus |
| `lib/db/messages.ts` | Message | listByConversation, listByLead, create, markRead, toggleStar |
| `lib/db/content-posts.ts` | ContentPost | list, getById, create, update, schedule, markPosted |
| `lib/db/automations.ts` | InboundAutomation | list, getById, create, update, updateStatus |
| `lib/db/activity-log.ts` | ActivityLog | list (paginated), create, getStats |
| `lib/db/settings.ts` | User + Workspace | getProfile, updateProfile, getWorkspace, updateWorkspace |
| `lib/db/auth-helpers.ts` | Session → Workspace | getWorkspaceIdFromSession (shared auth utility) |

**Patterns:**
- Every function takes `workspaceId` as first param (workspace-scoped)
- `getWorkspaceIdFromSession()` resolves JWT session → userId → workspace membership
- Zod schemas for input validation co-located with service functions
- Return typed results (Prisma generated types, no `any`)
- Pagination via `{ page, pageSize }` → `{ data, total, page, pageSize, totalPages }`

**Acceptance criteria:**
- [ ] All 11 files created with full CRUD operations
- [ ] Every function is typed (params + return)
- [ ] Workspace scoping enforced on every query
- [ ] `tsc --noEmit` passes
- [ ] Unit-testable (pure Prisma calls, no HTTP layer)

---

### Block 2: CRUD API Routes

**Goal:** Create RESTful API routes for every entity, all Zod-validated, all workspace-scoped via session.

**Routes to create:**
| Route | Methods | Purpose |
|-------|---------|---------|
| `api/campaigns/route.ts` | GET, POST | List campaigns, create campaign |
| `api/campaigns/[id]/route.ts` | GET, PATCH, DELETE | Get/update/delete campaign |
| `api/campaigns/[id]/status/route.ts` | PATCH | Start/pause/complete campaign |
| `api/campaigns/[id]/leads/route.ts` | GET, POST | Get/assign leads to campaign |
| `api/campaigns/[id]/sequences/route.ts` | GET, POST, PUT | Get/create/reorder sequences |
| `api/leads/route.ts` | GET, POST | List leads (filtered), create lead |
| `api/leads/[id]/route.ts` | GET, PATCH, DELETE | Get/update/delete lead |
| `api/leads/import/route.ts` | POST | CSV bulk import |
| `api/linkedin-accounts/route.ts` | GET, POST | List accounts, add account |
| `api/linkedin-accounts/[id]/route.ts` | GET, PATCH, DELETE | Get/update/delete account |
| `api/messages/route.ts` | GET, POST | List conversations, send message |
| `api/messages/[id]/route.ts` | PATCH | Mark read, toggle star |
| `api/content-posts/route.ts` | GET, POST | List posts, save generated post |
| `api/content-posts/[id]/route.ts` | GET, PATCH, DELETE | Get/update/delete post |
| `api/content-posts/[id]/schedule/route.ts` | POST | Schedule post |
| `api/automations/route.ts` | GET, POST | List automations, create automation |
| `api/automations/[id]/route.ts` | GET, PATCH, DELETE | Get/update/delete automation |
| `api/dashboard/stats/route.ts` | GET | Aggregated KPIs for dashboard |
| `api/dashboard/activity/route.ts` | GET | Activity feed from activity_log |
| `api/settings/profile/route.ts` | GET, PATCH | Get/update user profile |
| `api/settings/workspace/route.ts` | GET, PATCH | Get/update workspace |

**Patterns:**
- Every route: `getServerSession()` → `getWorkspaceIdFromSession()` → call service layer
- POST/PATCH: Zod validation on request body, return 400 on failure
- GET with filters: query params parsed via Zod
- Standard response shape: `{ data }` or `{ error, details }`
- HTTP status codes: 200 (ok), 201 (created), 400 (validation), 401 (unauth), 404 (not found), 500 (server)

**Acceptance criteria:**
- [ ] All 21 route files created
- [ ] Every route authenticates via session
- [ ] Every POST/PATCH validates input with Zod
- [ ] `tsc --noEmit` passes
- [ ] Routes testable via curl/Postman

---

### Block 3: Dashboard — Real Data

**Goal:** Replace all hardcoded KPIs, charts, and feed with real database aggregations.

**What changes:**
| Component | Currently | After |
|-----------|-----------|-------|
| 5 KPI cards | Hardcoded numbers | `GET /api/dashboard/stats` → aggregate from campaigns + campaign_leads |
| Activity feed | Hardcoded array | `GET /api/dashboard/activity` → last 20 entries from activity_log |
| Account analytics table | Hardcoded rows | `GET /api/linkedin-accounts` → real accounts with usage stats |
| Conversion funnel | Hardcoded percentages | Calculated from real campaign_leads status distribution |
| AI Insights | Hardcoded insights | `POST /api/content/generate` with dashboard data context (or static until data exists) |
| Time filter | No effect | Pass `timeRange` param to API, filter by `created_at` |
| Campaign filter | No effect | Pass `campaignId` param to API, filter aggregations |

**Acceptance criteria:**
- [ ] Dashboard shows real zeros for new workspace (no fake data)
- [ ] As campaigns/leads are created, KPIs update
- [ ] Activity feed shows real actions
- [ ] Time filter and campaign filter affect displayed data
- [ ] Loading states while fetching
- [ ] Empty state when no data exists

---

### Block 4: Campaigns + Sequences — Real Data

**Goal:** Full campaign CRUD, wizard persists to DB, sequence builder saves/loads real data.

**What changes:**
| Page | Currently | After |
|------|-----------|-------|
| `/campaigns` | 8 hardcoded campaigns | `GET /api/campaigns` → real list with stats |
| `/campaigns/new` | Wizard saves nothing | POST to `/api/campaigns` + `/api/campaigns/[id]/sequences` |
| `/campaigns/[id]` | Hardcoded detail | `GET /api/campaigns/[id]` with leads, sequences, schedule |
| `/campaigns/[id]/create` | Local-only sequence builder | Load/save sequences via API |

**Sequence builder specifics:**
- Load sequence nodes from `GET /api/campaigns/[id]/sequences`
- Save on "Save" click → `PUT /api/campaigns/[id]/sequences` (replace all)
- Node types map to `action_type` enum in Sequence model
- Condition nodes store `condition_type` + `condition_value`
- Template library inserts pre-built sequences via POST

**Campaign lifecycle:**
- Draft → Active → Paused → Completed
- Status change via `PATCH /api/campaigns/[id]/status`
- Active campaigns enqueue to BullMQ via existing `/api/campaigns/schedule`

**Acceptance criteria:**
- [ ] Campaign list shows real campaigns from DB
- [ ] Create wizard persists campaign + leads + accounts + sequences + schedule
- [ ] Campaign detail page loads real data
- [ ] Sequence builder loads/saves to DB
- [ ] Campaign status changes persist
- [ ] Duplicate campaign creates a real copy
- [ ] Search + filters work on real data
- [ ] Pagination works with real total count

---

### Block 5: Leads + Extractor — Real Data

**Goal:** Lead database reads from Prisma, CSV import writes to DB, enrichment updates DB, extractor saves results.

**What changes:**
| Page | Currently | After |
|------|-----------|-------|
| `/leads/database` | 25 hardcoded leads | `GET /api/leads?page=1&filters=...` → paginated from DB |
| `/leads/extractor` | 5 hardcoded jobs | Extraction jobs tracked in DB, results saved as leads |
| Filters | Client-side only | Server-side filtering via Prisma `where` clauses |
| CSV import | No implementation | `POST /api/leads/import` → parse CSV, bulk create leads |
| ICP scoring | Mock badges | Real scores from `lead.icp_score` field |
| Enrichment | No implementation | `POST /api/leads/enrich` → PDL lookup → update lead fields |

**Lead database filter mapping:**
- General: search (name, title, company), tags, source
- Company: company name, size, industry
- Location: country, city
- Seniority: title keywords
- ICP Score: min/max range
- Enrichment: status filter

**Acceptance criteria:**
- [ ] Lead list shows real leads from DB (empty for new workspace)
- [ ] All filter categories work server-side
- [ ] CSV import creates leads in bulk
- [ ] ICP scores displayed from DB field
- [ ] Enrichment button calls PDL API and updates lead
- [ ] Extractor saves extracted leads to DB
- [ ] Pagination shows real total counts
- [ ] Sort by any column works server-side
- [ ] Export generates real CSV from DB query

---

### Block 6: Unibox + LinkedIn Accounts — Real Data

**Goal:** Messages CRUD, conversations grouped per lead, LinkedIn account management.

**What changes:**
| Page | Currently | After |
|------|-----------|-------|
| `/unibox` | 8 hardcoded conversations | `GET /api/messages` → grouped by lead_id |
| Message thread | Hardcoded bubbles | `GET /api/messages?leadId=X` → real messages |
| Send message | No-op | `POST /api/messages` → save to DB (+ optionally send via LinkedIn adapter) |
| AI suggestions | Hardcoded | `POST /api/content/generate` with conversation context |
| Star/read | Client-only state | `PATCH /api/messages/[id]` → persist to DB |
| `/linkedin/accounts` | Hardcoded table | `GET /api/linkedin-accounts` → real accounts |
| Add account | No-op | `POST /api/linkedin-accounts` → save to DB |
| Account actions | No-op | PATCH/DELETE on `/api/linkedin-accounts/[id]` |

**Conversation model:**
- Messages grouped by `(linkedin_account_id, lead_id)` = one conversation
- Conversation list: last message per lead, unread count, lead info
- Thread: all messages between account and lead, ordered by `sent_at`

**Acceptance criteria:**
- [ ] Unibox shows real conversations (empty for new workspace)
- [ ] Message thread loads real messages
- [ ] Send message saves to DB
- [ ] Star/read persists to DB
- [ ] AI suggestions use conversation context
- [ ] LinkedIn accounts list shows real accounts
- [ ] Add/edit/delete accounts persists to DB
- [ ] Account health/usage metrics from real data
- [ ] Filters (unread/starred/account) work on real data

---

### Block 7: Content + Automations + Settings — Real Data

**Goal:** Generated content saved to library, scheduled posts from DB, automations CRUD, profile/workspace settings persist.

**What changes:**
| Page | Currently | After |
|------|-----------|-------|
| Content — Create | Real Claude API (partial) | Also save to `ContentPost` on generate |
| Content — Library | 5 hardcoded posts | `GET /api/content-posts` → real saved posts |
| Content — Schedule | Hardcoded | `GET /api/content-posts?status=scheduled` + `?status=posted` |
| Schedule post | No-op | `POST /api/content-posts/[id]/schedule` → BullMQ job |
| Automations list | 3 hardcoded | `GET /api/automations` → real list |
| Create automation | Wizard saves nothing | `POST /api/automations` → persist all 5 steps |
| Automation dashboard | Hardcoded KPIs | Aggregated from activity_log per automation |
| Settings — Profile | Hardcoded | `GET/PATCH /api/settings/profile` → real user data |
| Settings — Workspace | Hardcoded | `GET/PATCH /api/settings/workspace` → real workspace |
| Settings — Notifications | Client-only | Persist to user preferences (JSON field or table) |
| Settings — Security | No-op | Password change via Prisma, session list from DB |

**Acceptance criteria:**
- [ ] Generated content auto-saved to library
- [ ] Library shows real posts with status badges
- [ ] Schedule post enqueues BullMQ job
- [ ] Inbound automations full CRUD
- [ ] Automation wizard persists all 5 steps
- [ ] Profile changes persist (name, email, timezone)
- [ ] Workspace settings persist (name, branding)
- [ ] Password change works
- [ ] Notification preferences persist

---

## Exclusions

| Item | Reason | When |
|------|--------|------|
| Stripe / Billing | Sekundärt — sista steg polish | After all 7 blocks |
| Academy | Static content, not data-driven | Stays as-is |
| Integrations (HubSpot, etc.) | Third-party OAuth flows, complex | Future enhancement |

---

## Build Order & Dependencies

```
Block 1: Service Layer          ← Foundation, all other blocks depend on this
    ↓
Block 2: CRUD API Routes        ← HTTP layer on top of service layer
    ↓
Block 3: Dashboard              ← Reads from campaigns, leads, activity_log
    ↓
Block 4: Campaigns + Sequences  ← Full CRUD, references leads + accounts
    ↓
Block 5: Leads + Extractor      ← Full CRUD, CSV import, enrichment, ICP
    ↓
Block 6: Unibox + Accounts      ← Messages CRUD, account management
    ↓
Block 7: Content + Auto + Sett. ← Content library, automations, user settings
```

---

## Completed Work (Phase 1 — Service Libraries)

> These are the building blocks. They provide external API integrations but do NOT touch the database.

| Point | Status | Commit | What It Does |
|-------|--------|--------|--------------|
| AI Content Generation | ✅ | `2cdd14d` | Claude API wrapper, generates LinkedIn post variants |
| ICP Scoring | ✅ | `91600c8` | Claude API lead scoring, batch up to 50 leads |
| BullMQ Scheduling | ✅ | `d84af7e` | 3 Redis queues (campaign, content, enrichment) |
| Lead Enrichment (PDL) | ✅ | `f16d9d6` | People Data Labs client, 3 enrichment methods |
| LinkedIn Automation | ✅ | `b83dd13` | Playwright adapter + mock adapter, 5 API routes |

---

## Block Status Tracker

| Block | Status | Started | Completed | Commit |
|-------|--------|---------|-----------|--------|
| 1. Service Layer | ⬜ Not Started | — | — | — |
| 2. CRUD API Routes | ⬜ Not Started | — | — | — |
| 3. Dashboard | ⬜ Not Started | — | — | — |
| 4. Campaigns + Sequences | ⬜ Not Started | — | — | — |
| 5. Leads + Extractor | ⬜ Not Started | — | — | — |
| 6. Unibox + Accounts | ⬜ Not Started | — | — | — |
| 7. Content + Auto + Settings | ⬜ Not Started | — | — | — |
