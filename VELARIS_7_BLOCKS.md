# VELARIS — Backend Implementation Prompts (7 Blocks)
# Said Borna — 2026-03-08

---

## CRITICAL RULES FOR ALL 7 BLOCKS

Read these rules before starting ANY block. Violating any of these is unacceptable.

### 1. DO NOT TOUCH THE UI
- Do NOT modify any component's visual appearance, layout, colors, spacing, or animations
- Do NOT rename CSS classes, change Tailwind utilities, or alter component structure
- Do NOT remove or reorder any elements the user currently sees
- The ONLY changes allowed in page files are: replacing hardcoded mock data with API calls (fetch/SWR), adding loading/error states that already exist (skeleton components), and wiring form submissions to API endpoints
- If a page currently shows 5 KPI cards with specific colors and labels, it must show the EXACT same 5 KPI cards with the EXACT same colors and labels after your changes — but with real data instead of hardcoded numbers

### 2. MOCK DATA PRESERVATION
- The demo account (said@saidborna.com / REDACTED-PASSWORD) MUST have pre-seeded data that matches what the app currently shows
- Create a comprehensive seed script (prisma/seed.ts) that populates the demo workspace with realistic data:
  - 6-8 campaigns with varied statuses (active, paused, completed, draft)
  - 25+ leads with names, titles, companies, ICP scores, contact info
  - 4 LinkedIn accounts (Mathias Warg, [redacted], [redacted], Martin Smith or similar)
  - Message threads between accounts and leads
  - Content posts (drafts, scheduled, posted)
  - 3 inbound automations
  - Activity log entries for the dashboard feed
- This seed data ensures the demo ALWAYS looks populated and impressive
- New users who sign up get an empty workspace — they see empty states, not demo data

### 3. DUAL MODE: DEMO + LIVE
- said@saidborna.com is BOTH demo and live account
- Seeded mock data is real database rows — they persist, can be edited, deleted
- Said can ALSO create new campaigns, add new leads, etc. alongside the seeded data
- New users get fresh empty workspaces with the existing empty state components

### 4. WORKSPACE SCOPING
- EVERY database query MUST be scoped to the current user's workspace
- Use getServerSession() → find workspace membership → use workspaceId in all queries
- No user should ever see another user's data

### 5. BUILD VERIFICATION
After EVERY block:
- `npx tsc --noEmit` — zero errors
- `npm run build` — all routes compile
- Manually verify the page looks IDENTICAL to before (same layout, same feel)
- The only visible difference should be: real data instead of hardcoded, and forms that actually save

### 6. GIT
- One commit per block: `feat: Block X — [description]`
- Do not squash multiple blocks into one commit

---

## BLOCK 1: Service Layer (Prisma Query Helpers)

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 1 specification. Then implement the following.

Create lib/db/ directory with typed Prisma query functions for every entity. These are pure database functions — no HTTP, no auth checking. Auth is handled by the API routes in Block 2.

CRITICAL: Do NOT modify any existing page files, components, or UI code. This block is backend-only.

Files to create:

1. lib/db/auth-helpers.ts
   - getWorkspaceIdFromSession(session): takes a NextAuth session, finds the user's workspace membership, returns workspaceId
   - This is the shared utility every API route will use

2. lib/db/campaigns.ts
   - listCampaigns(workspaceId, { page, pageSize, status?, search? })
   - getCampaignById(workspaceId, campaignId)
   - createCampaign(workspaceId, data)
   - updateCampaign(workspaceId, campaignId, data)
   - updateCampaignStatus(workspaceId, campaignId, status)
   - getCampaignStats(workspaceId, campaignId) — aggregate from campaign_leads
   - deleteCampaign(workspaceId, campaignId)

3. lib/db/leads.ts
   - listLeads(workspaceId, { page, pageSize, filters, sort, search })
   - getLeadById(workspaceId, leadId)
   - createLead(workspaceId, data)
   - bulkCreateLeads(workspaceId, leads[]) — for CSV import
   - updateLead(workspaceId, leadId, data)
   - deleteLead(workspaceId, leadId)

4. lib/db/campaign-leads.ts
   - listCampaignLeads(workspaceId, campaignId, { page, pageSize, status? })
   - assignLeadsToCampaign(workspaceId, campaignId, leadIds[], linkedinAccountId?)
   - updateCampaignLeadStatus(workspaceId, campaignLeadId, status)
   - getNextScheduledActions(workspaceId) — for BullMQ worker

5. lib/db/sequences.ts
   - listSequences(workspaceId, campaignId)
   - createSequence(workspaceId, campaignId, data)
   - updateSequence(workspaceId, sequenceId, data)
   - reorderSequences(workspaceId, campaignId, orderedIds[])
   - deleteSequence(workspaceId, sequenceId)

6. lib/db/linkedin-accounts.ts
   - listAccounts(workspaceId)
   - getAccountById(workspaceId, accountId)
   - createAccount(workspaceId, data)
   - updateAccount(workspaceId, accountId, data)
   - updateAccountUsage(workspaceId, accountId, { connectionsUsed, messagesUsed })
   - deleteAccount(workspaceId, accountId)

7. lib/db/messages.ts
   - listConversations(workspaceId, { filter?, search?, accountId? }) — grouped by lead, last message, unread count
   - listMessagesByLead(workspaceId, leadId, linkedinAccountId)
   - createMessage(workspaceId, data)
   - markAsRead(workspaceId, messageId)
   - toggleStar(workspaceId, messageId)

8. lib/db/content-posts.ts
   - listPosts(workspaceId, { status?, page, pageSize })
   - getPostById(workspaceId, postId)
   - createPost(workspaceId, data)
   - updatePost(workspaceId, postId, data)
   - schedulePost(workspaceId, postId, scheduledAt, linkedinAccountId)
   - markAsPosted(workspaceId, postId)
   - deletePost(workspaceId, postId)

9. lib/db/automations.ts
   - listAutomations(workspaceId)
   - getAutomationById(workspaceId, automationId)
   - createAutomation(workspaceId, data) — includes trigger_keywords, messages, account assignments
   - updateAutomation(workspaceId, automationId, data)
   - updateAutomationStatus(workspaceId, automationId, status)
   - deleteAutomation(workspaceId, automationId)

10. lib/db/activity-log.ts
    - listActivity(workspaceId, { page, pageSize, campaignId? })
    - createActivity(workspaceId, data)
    - getDashboardStats(workspaceId, { timeRange, campaignId? }) — aggregates for KPIs

11. lib/db/settings.ts
    - getProfile(userId)
    - updateProfile(userId, data)
    - getWorkspace(workspaceId)
    - updateWorkspace(workspaceId, data)

Every function:
- Uses Prisma client (import { prisma } from wherever it's configured)
- Is fully typed (params and return types)
- Enforces workspaceId scoping in WHERE clauses
- Returns typed results using Prisma generated types
- Pagination functions return { data, total, page, pageSize, totalPages }

After creating all files: run `npx tsc --noEmit` to verify zero errors.
Commit: `feat: Block 1 — service layer with typed Prisma query helpers for all entities`
```

---

## BLOCK 2: CRUD API Routes + Seed Script

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 2 specification. Then implement the following.

CRITICAL: Do NOT modify any existing page files, components, or UI code. This block creates API routes and the seed script only.

### Part A: API Routes

Create RESTful API routes that use the service layer from Block 1. Every route must:
- Call getServerSession() and reject with 401 if no session
- Call getWorkspaceIdFromSession() to get the workspace
- Validate POST/PATCH bodies with Zod
- Return consistent JSON: { data } on success, { error, details? } on failure
- Use correct HTTP status codes: 200, 201, 400, 401, 404, 500

Routes to create:

app/api/campaigns/route.ts — GET (list), POST (create)
app/api/campaigns/[id]/route.ts — GET, PATCH, DELETE
app/api/campaigns/[id]/status/route.ts — PATCH (change status)
app/api/campaigns/[id]/leads/route.ts — GET, POST (assign leads)
app/api/campaigns/[id]/sequences/route.ts — GET, POST, PUT (replace all)
app/api/leads/route.ts — GET (filtered/paginated), POST (create)
app/api/leads/[id]/route.ts — GET, PATCH, DELETE
app/api/leads/import/route.ts — POST (CSV bulk import)
app/api/linkedin-accounts/route.ts — GET, POST
app/api/linkedin-accounts/[id]/route.ts — GET, PATCH, DELETE
app/api/messages/route.ts — GET (conversations), POST (send)
app/api/messages/[id]/route.ts — PATCH (read, star)
app/api/content-posts/route.ts — GET, POST
app/api/content-posts/[id]/route.ts — GET, PATCH, DELETE
app/api/content-posts/[id]/schedule/route.ts — POST
app/api/automations/route.ts — GET, POST
app/api/automations/[id]/route.ts — GET, PATCH, DELETE
app/api/dashboard/stats/route.ts — GET (aggregated KPIs)
app/api/dashboard/activity/route.ts — GET (activity feed)
app/api/settings/profile/route.ts — GET, PATCH
app/api/settings/workspace/route.ts — GET, PATCH

### Part B: Seed Script

Create prisma/seed.ts that populates the demo workspace:

The seed must be idempotent — running it twice should not duplicate data.
Use upsert or check-before-create patterns.

Demo user: said@saidborna.com (already exists from signup)
Find or create their workspace, then populate:

CAMPAIGNS (6):
- "Series A Startups" — completed, high stats (2100 sent, 1050 accepted, 28% reply, 22 opportunities)
- "Outreach to Agency Owners" — active (1240 sent, 632 accepted, 24% reply, 12 opportunities)
- "SaaS Founders Europe" — active (890 sent, 445 accepted, 18% reply, 8 opportunities)
- "E-commerce Heads Nordics" — paused (560 sent, 280 accepted, 20% reply, 7 opportunities)
- "B2B Decision Makers" — paused (320 sent, 160 accepted, 22% reply, 5 opportunities)
- "Consulting Founders" — draft (0 stats)

LINKEDIN ACCOUNTS (4):
- Mathias Warg — Connected, Sales Navigator, 8240 connections, health 93, warmup enabled, proxy configured
- [redacted] — Connected, Premium, 5912 connections, health 89, warmup disabled, proxy configured
- [redacted] — Syncing, Premium, 4508 connections, health 78, warmup enabled, proxy not set
- Martin Smith — Error, Basic, 3192 connections, health 52, warmup disabled, proxy not set

LEADS (25+):
Use realistic names, titles, companies. Mix of high/medium/low ICP scores.
Include leads like: [redacted] (Co-Founder, [redacted], ICP 97), [redacted] (Co-Founder & CEO, Velaris, ICP 95), etc.
Vary: source (csv, extractor, database), enrichment_status, tags, locations.

MESSAGES (20+):
Create realistic conversation threads between accounts and leads.
Mix of sent/received, some read, some unread, some starred.
Include the [redacted] conversation that's currently shown in Unibox.

CONTENT POSTS (5):
Mix of draft, scheduled, posted. Include realistic LinkedIn post content.

INBOUND AUTOMATIONS (3):
- "Lead Magnet — LinkedIn Playbook" — active, 142 completed, 3 processing, 2 failed
- "Free Audit — Agency Owners" — active, 87 completed, 1 processing, 0 failed
- "Content Calendar Template" — paused, 56 completed, 0 processing, 1 failed

ACTIVITY LOG (30+):
Recent activities for the dashboard feed: connection_sent, connection_accepted, message_sent, reply_received, opportunity_created. Spread across last 30 days.

SEQUENCES:
For the active campaigns, create sequence steps matching the visual flowchart shown in the app.

Add to package.json: "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
Or use tsx: "prisma": { "seed": "tsx prisma/seed.ts" }

After creating all files:
- `npx tsc --noEmit` — zero errors
- `npx prisma db seed` — runs without errors
- Verify seed data exists in Railway PostgreSQL

Commit: `feat: Block 2 — CRUD API routes + comprehensive seed script`
```

---

## BLOCK 3: Dashboard — Wire to Real Data

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 3 specification. Then implement the following.

CRITICAL UI RULE: The dashboard page must look IDENTICAL after this change. Same 5 KPI cards, same colors, same chart, same funnel, same activity feed, same AI insights. The ONLY difference is that data comes from the API instead of hardcoded constants.

Open app/(app)/dashboard/page.tsx. Identify every hardcoded data source. Replace each one with an API fetch.

Changes to make:

1. KPI CARDS — Currently hardcoded numbers (1630, 848, 1162, 203, $70.0K)
   Replace with: fetch GET /api/dashboard/stats
   The API returns: { connectionsSent, connectionsAccepted, messagesSent, repliesReceived, opportunitiesValue, percentChanges: { ... } }
   Map these to the exact same card layout — same labels, same colors, same percentage badges

2. ACTIVITY FEED — Currently hardcoded array of activities
   Replace with: fetch GET /api/dashboard/activity?limit=20
   Map to same feed item layout — same icons, same text format, same timestamps

3. CONVERSION FUNNEL — Currently hardcoded (1630 → 848 → 203 → 81)
   Replace with: calculated from /api/dashboard/stats response
   Same bar widths, same colors, same percentage labels between stages

4. ACCOUNT ANALYTICS TABLE — Currently hardcoded rows
   Replace with: fetch GET /api/linkedin-accounts
   Map to same table columns: Account, Conn. Sent, Accepted, Msgs Sent, Replies, Opportunities

5. TIME FILTER — Currently does nothing
   Wire to: re-fetch /api/dashboard/stats?timeRange=1d|1w|1m
   API filters activity_log by created_at within range

6. CAMPAIGN FILTER — Currently does nothing
   Wire to: re-fetch /api/dashboard/stats?campaignId=xxx
   API filters by specific campaign

7. AI INSIGHTS — Keep as generated from the stats data (can stay client-side calculated)

Implementation pattern:
- Use React useState + useEffect for data fetching (or SWR if already installed)
- Show the existing loading skeleton while fetching
- Show the existing empty state if no data (new user)
- For the demo account (seeded data), the dashboard should show populated data identical to current mock

DO NOT change:
- Card colors, sizes, layout
- Chart appearance or type
- Funnel bar colors or layout
- Feed item styling
- Any CSS classes or Tailwind utilities
- Page structure or component hierarchy

After changes:
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean
- Verify dashboard looks identical with seeded data
- Verify new user sees empty/zero state

Commit: `feat: Block 3 — dashboard wired to real database with live KPIs and activity feed`
```

---

## BLOCK 4: Campaigns + Sequences — Wire to Real Data

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 4 specification. Then implement the following.

CRITICAL UI RULE: Every campaign page must look IDENTICAL after this change. Same table columns, same status badges, same colors, same wizard steps, same sequence builder nodes. Only the data source changes.

Pages to modify:

1. app/(app)/campaigns/page.tsx (Campaign List)
   - Replace hardcoded campaigns array with: fetch GET /api/campaigns?page=X&status=X&search=X
   - Wire search input to re-fetch with search param
   - Wire status filter tabs to re-fetch with status param
   - Wire sort columns to re-fetch with sort param
   - Wire pagination to real total count
   - Wire delete action to: DELETE /api/campaigns/[id], then refresh list
   - Wire duplicate action to: POST /api/campaigns with copied data
   - Performance grade badges: calculate from real reply rate (same A/B/C/D logic)

2. app/(app)/campaigns/new/page.tsx (Campaign Wizard)
   - Step 1 (Setup): On "Create", POST /api/campaigns with name → get campaign ID
   - Step 2 (Leads): Show leads from GET /api/leads, allow selection, POST /api/campaigns/[id]/leads
   - Step 3 (Accounts): Show accounts from GET /api/linkedin-accounts, allow selection
   - Step 4 (Sequences): Save sequence on next/save via POST /api/campaigns/[id]/sequences
   - Step 5 (Schedule): Save schedule config via PATCH /api/campaigns/[id]
   - On final submit: campaign is created with all associations

3. app/(app)/campaigns/[id]/page.tsx (Campaign Detail)
   - Replace hardcoded detail with: fetch GET /api/campaigns/[id]
   - Analytics tab: real stats from campaign data
   - Leads tab: fetch GET /api/campaigns/[id]/leads
   - Sequences tab: fetch GET /api/campaigns/[id]/sequences
   - Schedule tab: real schedule from campaign record
   - Accounts tab: real linked accounts
   - Pause/Resume: PATCH /api/campaigns/[id]/status

4. app/(app)/campaigns/[id]/create/page.tsx (Campaign Editor + Sequence Builder)
   - Load existing sequences: GET /api/campaigns/[id]/sequences
   - Save sequences: PUT /api/campaigns/[id]/sequences (replace all)
   - Sequence builder component (components/campaigns/sequence-builder.tsx): NO visual changes
   - Only change: data source (load from API instead of local state, save to API on save)

5. Template library modal:
   - When user picks a template, POST the template's sequence steps to API
   - Same 5 templates, same names, same node configurations

DO NOT change:
- Table column order, widths, or styling
- Status badge colors or text
- Wizard step layout or progress indicators
- Sequence builder node shapes, colors, or connection lines
- Any visual element whatsoever

After changes:
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean
- Verify campaign list shows seeded campaigns (identical to current mock)
- Verify creating a new campaign persists to DB
- Verify sequence builder loads/saves correctly

Commit: `feat: Block 4 — campaigns and sequences wired to real database CRUD`
```

---

## BLOCK 5: Leads + Extractor — Wire to Real Data

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 5 specification. Then implement the following.

CRITICAL UI RULE: Lead database and extractor pages must look IDENTICAL. Same filter panel, same table columns, same grid cards, same extractor layout. Only data source changes.

Pages to modify:

1. app/(app)/leads/database/page.tsx (Lead Database)
   - Replace hardcoded 25 leads with: fetch GET /api/leads?page=X&pageSize=25&filters=...&sort=...&search=...
   - Wire all 11 filter categories to API query params:
     - General: search → ?search=term
     - Seniority checkboxes → ?seniority=C-Suite,VP,Director
     - Departments → ?departments=Sales,Marketing
     - Location → ?location=United States,Sweden
     - Company size, industry, etc.
   - Wire sort columns to ?sort=name&order=asc
   - Wire pagination to real {total, page, totalPages}
   - Wire "AI Search" button to ?aiSearch=query (can use existing search for now)
   - Wire "Export Data" to generate CSV from current filtered results
   - Wire "Find Similar" (lookalike) to ?similarTo=leadId
   - ICP score badges: read from lead.icp_score (same High/Medium/Low thresholds)
   - Table/Grid view: same toggle, just different rendering of same API data

2. app/(app)/leads/extractor/page.tsx (Lead Extractor)
   - Left panel (extraction history): fetch from a local state or simple API tracking
   - For MVP: extraction jobs can be tracked client-side with results saved as leads
   - "Extract Leads" button: POST /api/leads with source='extractor'
   - Results table: shows newly created leads from extraction
   - "Add to Campaign" button: POST /api/campaigns/[id]/leads with selected lead IDs
   - "Export" button: generate CSV from displayed leads
   - Enrichment stats (Found, Enriched, With Email, With Phone): aggregate from lead fields

3. CSV Import:
   - Add file upload handler
   - Parse CSV client-side (Papa Parse or similar)
   - POST /api/leads/import with parsed rows
   - Show import progress and result count
   - Created leads appear in lead database immediately

DO NOT change:
- Filter panel layout or category names
- Table column order or styling
- Grid card layout
- ICP badge colors (green High, yellow Medium, red Low)
- Extractor split-view layout
- Any visual element

After changes:
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean
- Verify lead database shows seeded leads (identical to current)
- Verify filters work server-side
- Verify creating/importing leads persists to DB
- Verify pagination shows real counts

Commit: `feat: Block 5 — leads and extractor wired to real database with server-side filtering`
```

---

## BLOCK 6: Unibox + LinkedIn Accounts — Wire to Real Data

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 6 specification. Then implement the following.

CRITICAL UI RULE: Unibox and LinkedIn Accounts pages must look IDENTICAL. Same conversation list, same message bubbles, same account table. Only data source changes.

Pages to modify:

1. app/(app)/unibox/page.tsx (Unified Inbox)
   - Replace hardcoded conversations with: fetch GET /api/messages (returns conversations grouped by lead)
   - Each conversation: lead info, last message, unread count, sentiment, campaign tag, account badge
   - When selecting a conversation: fetch GET /api/messages?leadId=X&accountId=Y
   - Display message thread with same bubble layout (purple sent, dark received)
   - Send message: POST /api/messages with { leadId, linkedinAccountId, content, direction: 'sent' }
   - Star toggle: PATCH /api/messages/[id] with { starred: true/false }
   - Mark as read: PATCH /api/messages/[id] with { read: true } when conversation is opened
   - Filter tabs (All/Unread/Starred/Archived): wire to ?filter=unread|starred|archived
   - Account filter dropdown: wire to ?accountId=X
   - Search: wire to ?search=term
   - AI suggestions: keep current behavior (can use Claude API or stay mock)
   - Sentiment badges: keep current logic or derive from message content

2. app/(app)/linkedin/accounts/page.tsx (LinkedIn Accounts)
   - Replace hardcoded accounts with: fetch GET /api/linkedin-accounts
   - Summary cards (Connected, Health Score, Warmup, Proxy): aggregate from real account data
   - Table: same columns, real data from API
   - "Add LinkedIn Account" button: open modal, POST /api/linkedin-accounts
   - "Manage" button: open modal, PATCH /api/linkedin-accounts/[id]
   - Status indicators: read from account.status field
   - Health score: read from account data (or calculate)
   - Usage bars: read from daily_connections_used / daily_connection_limit
   - Warmup/Proxy badges: read from account fields

DO NOT change:
- Conversation list item layout
- Message bubble colors or styling
- Thread header layout
- AI suggestion panel appearance
- Account table column order or styling
- Summary card colors or layout
- Any visual element

After changes:
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean
- Verify unibox shows seeded conversations (identical to current)
- Verify sending a message persists to DB and appears in thread
- Verify star/read persists
- Verify LinkedIn accounts shows seeded accounts (identical to current)
- Verify adding/editing accounts persists

Commit: `feat: Block 6 — unibox and LinkedIn accounts wired to real database`
```

---

## BLOCK 7: Content + Automations + Settings — Wire to Real Data

### Prompt — paste this into Claude Code:

```
Read ROADMAP.md Block 7 specification. Then implement the following.

CRITICAL UI RULE: Content Assistant, Inbound Automations, and Settings pages must look IDENTICAL. Only data source changes.

Pages to modify:

1. app/(app)/content/assistant/page.tsx (Content Assistant)
   - Create tab: ALREADY partially wired to Claude API — keep this
   - After generating content: POST /api/content-posts to save each variant to DB
   - Library tab: replace hardcoded posts with fetch GET /api/content-posts
   - Show real status badges (Draft/Scheduled/Posted) from DB
   - Posted items: show real metrics if available (or zeros)
   - Schedule tab: fetch GET /api/content-posts?status=scheduled and ?status=posted
   - "Schedule Post" action: POST /api/content-posts/[id]/schedule with datetime + accountId
   - "Copy" button: keep client-side clipboard copy
   - Brand Voice Training: keep current mock behavior

2. app/(app)/automations/inbound/page.tsx (Inbound Automations)
   - Replace hardcoded automations with: fetch GET /api/automations
   - Table: same columns, real data
   - "New Automation" wizard: POST /api/automations with all 5 steps data
   - Automation dashboard (click name): fetch GET /api/automations/[id] for detail
   - KPI cards (Completed/Processing/Failed): from automation record
   - Play/pause: PATCH /api/automations/[id] with { status: 'active'|'paused' }
   - Duplicate: POST /api/automations with copied data
   - Delete: DELETE /api/automations/[id]
   - Analytics (conversion chart, keywords, timeline): from activity_log filtered by automation

3. app/(app)/settings/page.tsx (Settings)
   - Profile tab: fetch GET /api/settings/profile, save with PATCH
   - Pre-populate form fields with real user data (name, email, timezone)
   - Workspace tab: fetch GET /api/settings/workspace, save with PATCH
   - Show real workspace name, member count
   - Billing tab: keep current static plan display (Stripe integration excluded)
   - Notifications tab: persist toggles (save to user preferences via PATCH /api/settings/profile with notificationPrefs JSON)
   - Security tab: password change via dedicated endpoint or PATCH profile
   - Active sessions: can stay mock for now

4. app/(app)/integrations/page.tsx (Integrations)
   - Keep current mock behavior for App connections (real OAuth excluded from scope)
   - API Keys tab: keep current mock
   - Webhooks tab: keep current mock
   - No DB changes needed for integrations — stays as-is

5. app/(app)/academy/page.tsx (Academy)
   - Keep current static behavior — not data-driven
   - No DB changes needed

DO NOT change:
- Content assistant form layout or tone grid
- Post preview card styling
- Automation table or wizard step layout
- Settings tab layout or form styling
- Any visual element

After changes:
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean
- Verify content library shows seeded posts
- Verify creating automation persists all 5 wizard steps
- Verify settings save and reload correctly
- Verify demo account shows populated data throughout

Commit: `feat: Block 7 — content, automations, and settings wired to real database`
```

---

## EXECUTION ORDER

Run these prompts in order: Block 1 → 2 → 3 → 4 → 5 → 6 → 7

After EACH block:
1. Verify build passes
2. Verify the affected pages look IDENTICAL to before
3. Verify data comes from DB (check Network tab — API calls visible)
4. Commit before starting next block

After Block 2 (seed script), run `npx prisma db seed` to populate demo data.
After Block 3+, the dashboard should show real seeded data.
By Block 7, every page behind login is fully database-backed.

---

## WHAT TO SEND SAID FOR QA AFTER EACH BLOCK

After each block, report:
```
BLOCK [X] COMPLETE
Files created: [count]
Files modified: [count]
tsc: zero errors
build: clean
Pages affected: [list]
Visual changes: NONE — data source only
Commit: [hash]
```
