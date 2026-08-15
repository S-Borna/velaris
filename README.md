# Velaris

**Live:** [velaris.saidborna.com](https://velaris.saidborna.com)

A full-stack LinkedIn automation + AI content SaaS, built as an independent capacity project.

Velaris covers the core workflow of a modern LinkedIn growth tool: outbound and inbound
campaigns, lead discovery and enrichment, ICP scoring, a unified inbox, AI-generated content,
and multi-account LinkedIn management — all built from scratch on a production-shaped stack.

## What this is

This is a portfolio / capability project, not a commercial product. The goal was to prove
end-to-end delivery of a production-grade SaaS: architecture, database design, background job
processing, third-party API integration, and a polished dark-theme UI, built solo in a
constrained timeframe.

## Features

- **Campaigns** — outbound sequence builder and inbound (comment-trigger) campaigns, with
  a visual flow for connection requests, messages, and follow-ups
- **Lead management** — lead database, lead extractor, and lead search with ICP (Ideal
  Customer Profile) scoring
- **Unibox** — unified inbox for replies across connected LinkedIn accounts
- **AI Content** — AI-assisted LinkedIn post generation and a content scheduler, powered by
  the Claude API
- **LinkedIn accounts** — multi-account connection and health monitoring
- **Integrations & Academy** — integration hub and onboarding/education section
- **Workspaces & billing** — workspace switching, team settings, and subscription billing
  via Stripe

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Background jobs | BullMQ + Redis |
| AI | Anthropic Claude API |
| Auth | NextAuth.js |
| Payments | Stripe |
| Animation | Framer Motion |

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)
- Redis instance (for background jobs)

### Install

```bash
npm install
```

### Configure environment

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=            # PostgreSQL connection string
REDIS_URL=                # Redis connection string
NEXTAUTH_SECRET=          # random secret for NextAuth session signing
NEXTAUTH_URL=              # e.g. http://localhost:3000
ANTHROPIC_API_KEY=         # Claude API key
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Set up the database

```bash
npx prisma migrate dev
npx prisma db seed   # optional — seeds demo data
```

### Run locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint the codebase
```

## Project structure

```
app/
  (app)/        # authenticated app routes (dashboard, campaigns, leads, unibox, etc.)
  (auth)/       # login / signup
  (marketing)/  # public marketing pages
  api/          # API routes
components/     # shared UI components
lib/            # business logic, integrations, utilities
prisma/         # database schema, migrations, seed script
```

See `ROADMAP.md` for the backend implementation plan and phase-by-phase build notes.
