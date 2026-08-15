// Copyright (c) Said Borna. All rights reserved.
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL || "demo@velaris.local";
const DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD ||
  require("crypto").randomBytes(12).toString("hex");
const DEMO_NAME = process.env.SEED_DEMO_NAME || "Demo User";
const WORKSPACE_NAME = "Personal Workspace";

/**
 * Comprehensive seed script — idempotent.
 * Populates demo workspace with data matching the live UI screenshots.
 */
async function main(): Promise<void> {
  console.log("Seeding database...");

  // ── 1. Demo user ──────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { fullName: DEMO_NAME, passwordHash },
    create: {
      email: DEMO_EMAIL,
      fullName: DEMO_NAME,
      passwordHash,
    },
  });

  console.log(`Demo user: ${user.email}`);
  if (!process.env.SEED_DEMO_PASSWORD) {
    console.log(`Demo password (generated, not stored): ${DEMO_PASSWORD}`);
  }

  // ── 2. Workspace ──────────────────────────────────────
  let workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: WORKSPACE_NAME, plan: "team" },
    });
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      },
    });
  } else {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan: "team" },
    });
  }

  const wId = workspace.id;
  console.log(`Workspace: ${workspace.name} (${wId})`);

  // ── 3. Clean existing seed data ───────────────────────
  await prisma.activityLog.deleteMany({ where: { workspaceId: wId } });
  await prisma.message.deleteMany({ where: { workspaceId: wId } });
  await prisma.inboundAutomationAccount.deleteMany({
    where: { automation: { workspaceId: wId } },
  });
  await prisma.inboundAutomation.deleteMany({ where: { workspaceId: wId } });
  await prisma.contentPost.deleteMany({ where: { workspaceId: wId } });
  await prisma.sequence.deleteMany({
    where: { campaign: { workspaceId: wId } },
  });
  await prisma.campaignLead.deleteMany({
    where: { campaign: { workspaceId: wId } },
  });
  await prisma.campaignAccount.deleteMany({
    where: { campaign: { workspaceId: wId } },
  });
  await prisma.campaign.deleteMany({ where: { workspaceId: wId } });
  await prisma.lead.deleteMany({ where: { workspaceId: wId } });
  await prisma.linkedinAccount.deleteMany({ where: { workspaceId: wId } });

  console.log("Cleaned existing data");

  // ── 4. LinkedIn Accounts ──────────────────────────────
  const accounts = await Promise.all([
    prisma.linkedinAccount.create({
      data: {
        workspaceId: wId,
        accountName: "Said Borna",
        linkedinUrl: "https://linkedin.com/in/saidborna",
        status: "connected",
        accountType: "Sales Navigator",
        dailyConnectionLimit: 50,
        dailyMessageLimit: 50,
        dailyConnectionsUsed: 47,
        dailyMessagesUsed: 47,
        proxyUrl: "https://proxy-se-1.velaris.io:8080",
        lastSyncAt: new Date(),
      },
    }),
    prisma.linkedinAccount.create({
      data: {
        workspaceId: wId,
        accountName: "Nolan Vance",
        linkedinUrl: "https://linkedin.com/in/elonmusk",
        status: "connected",
        accountType: "Premium",
        dailyConnectionLimit: 50,
        dailyMessageLimit: 50,
        dailyConnectionsUsed: 22,
        dailyMessagesUsed: 22,
        proxyUrl: "https://proxy-us-1.velaris.io:8080",
        lastSyncAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    }),
    prisma.linkedinAccount.create({
      data: {
        workspaceId: wId,
        accountName: "Ezra Kaplan",
        linkedinUrl: "https://linkedin.com/in/samaltman",
        status: "syncing",
        accountType: "Premium",
        dailyConnectionLimit: 50,
        dailyMessageLimit: 50,
        dailyConnectionsUsed: 18,
        dailyMessagesUsed: 18,
        lastSyncAt: new Date(),
      },
    }),
    prisma.linkedinAccount.create({
      data: {
        workspaceId: wId,
        accountName: "Wei Tanaka",
        linkedinUrl: "https://linkedin.com/in/jensenhuang",
        status: "connected",
        accountType: "Basic",
        dailyConnectionLimit: 50,
        dailyMessageLimit: 50,
        dailyConnectionsUsed: 0,
        dailyMessagesUsed: 0,
        lastSyncAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    }),
  ]);

  const [accSaid, accElon, accSam, accJensen] = accounts;
  console.log(`LinkedIn accounts: ${accounts.length}`);

  // ── 5. Campaigns ──────────────────────────────────────
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "Outreach to Agency Owners",
        status: "active",
        connectionsSent: 1240,
        connectionsAccepted: 632,
        messagesSent: 1162,
        repliesReceived: 278,
        opportunitiesValue: 48000,
        totalLeads: 1240,
        createdAt: new Date("2026-02-14"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "SaaS Founders Europe",
        status: "active",
        connectionsSent: 890,
        connectionsAccepted: 445,
        messagesSent: 712,
        repliesReceived: 128,
        opportunitiesValue: 32000,
        totalLeads: 890,
        createdAt: new Date("2026-02-20"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "B2B Decision Makers",
        status: "paused",
        connectionsSent: 320,
        connectionsAccepted: 160,
        messagesSent: 280,
        repliesReceived: 62,
        opportunitiesValue: 15000,
        totalLeads: 320,
        createdAt: new Date("2026-02-28"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "Marketing Directors DACH",
        status: "draft",
        connectionsSent: 0,
        connectionsAccepted: 0,
        messagesSent: 0,
        repliesReceived: 0,
        opportunitiesValue: 0,
        totalLeads: 0,
        createdAt: new Date("2026-03-01"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "Series A Startups",
        status: "completed",
        connectionsSent: 2100,
        connectionsAccepted: 1050,
        messagesSent: 1890,
        repliesReceived: 529,
        opportunitiesValue: 88000,
        totalLeads: 2100,
        createdAt: new Date("2026-01-15"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "HR Tech Buyers",
        status: "active",
        connectionsSent: 180,
        connectionsAccepted: 90,
        messagesSent: 140,
        repliesReceived: 21,
        opportunitiesValue: 5600,
        totalLeads: 180,
        createdAt: new Date("2026-03-03"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "E-commerce Heads Nordics",
        status: "paused",
        connectionsSent: 560,
        connectionsAccepted: 280,
        messagesSent: 450,
        repliesReceived: 90,
        opportunitiesValue: 21000,
        totalLeads: 560,
        createdAt: new Date("2026-02-10"),
      },
    }),
    prisma.campaign.create({
      data: {
        workspaceId: wId,
        name: "VP Sales US Tech",
        status: "draft",
        connectionsSent: 0,
        connectionsAccepted: 0,
        messagesSent: 0,
        repliesReceived: 0,
        opportunitiesValue: 0,
        totalLeads: 0,
        createdAt: new Date("2026-03-05"),
      },
    }),
  ]);

  const [campAgency, campSaaS, campB2B, campDACH, campSeries, campHR, campEcom] = campaigns;
  console.log(`Campaigns: ${campaigns.length}`);

  // Link accounts to campaigns
  await prisma.campaignAccount.createMany({
    data: [
      { campaignId: campAgency.id, linkedinAccountId: accSaid.id },
      { campaignId: campAgency.id, linkedinAccountId: accJensen.id },
      { campaignId: campSaaS.id, linkedinAccountId: accSaid.id },
      { campaignId: campSaaS.id, linkedinAccountId: accElon.id },
      { campaignId: campB2B.id, linkedinAccountId: accSaid.id },
      { campaignId: campSeries.id, linkedinAccountId: accSaid.id },
      { campaignId: campHR.id, linkedinAccountId: accSam.id },
      { campaignId: campEcom.id, linkedinAccountId: accElon.id },
    ],
  });

  // ── 6. Sequences for active campaigns ─────────────────
  await prisma.sequence.createMany({
    data: [
      { campaignId: campAgency.id, stepOrder: 0, actionType: "connect", messageTemplate: "Hi {firstName}, I noticed you run a successful agency. Would love to connect and exchange ideas on LinkedIn automation." },
      { campaignId: campAgency.id, stepOrder: 1, actionType: "wait", waitDays: 2 },
      { campaignId: campAgency.id, stepOrder: 2, actionType: "view_profile" },
      { campaignId: campAgency.id, stepOrder: 3, actionType: "wait", waitDays: 1 },
      { campaignId: campAgency.id, stepOrder: 4, actionType: "message", messageTemplate: "Thanks for connecting {firstName}! I help agency owners automate their LinkedIn outreach. Would a quick 15-min demo interest you?" },
      { campaignId: campAgency.id, stepOrder: 5, actionType: "wait", waitDays: 3 },
      { campaignId: campAgency.id, stepOrder: 6, actionType: "follow_up", messageTemplate: "Hey {firstName}, just following up. I know you're busy — happy to share a 2-min video walkthrough instead if that's easier?" },
    ],
  });

  await prisma.sequence.createMany({
    data: [
      { campaignId: campSaaS.id, stepOrder: 0, actionType: "connect", messageTemplate: "Hi {firstName}! I'm building an AI-powered LinkedIn platform and love connecting with fellow SaaS founders." },
      { campaignId: campSaaS.id, stepOrder: 1, actionType: "wait", waitDays: 1 },
      { campaignId: campSaaS.id, stepOrder: 2, actionType: "like_post" },
      { campaignId: campSaaS.id, stepOrder: 3, actionType: "wait", waitDays: 2 },
      { campaignId: campSaaS.id, stepOrder: 4, actionType: "message", messageTemplate: "Hey {firstName}, great to connect! I noticed {company} is doing amazing things. We should chat about how AI can scale your outreach." },
      { campaignId: campSaaS.id, stepOrder: 5, actionType: "wait", waitDays: 3 },
      { campaignId: campSaaS.id, stepOrder: 6, actionType: "follow_up", messageTemplate: "Following up {firstName} — we helped 50+ SaaS founders automate their LinkedIn pipeline. Would love to show you how." },
    ],
  });

  console.log("Sequences created");

  // ── 7. Leads ──────────────────────────────────────────
  const leadsData = [
    { firstName: "Tim", lastName: "Cook", title: "CEO", company: "Apple", location: "Cupertino, United States", email: "tcook@apple.com", phone: "+1 408 555 1234", icpScore: 98, source: "database", tags: ["Big Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Satya", lastName: "Nadella", title: "CEO", company: "Microsoft", location: "Redmond, United States", email: "satya@microsoft.com", phone: "+1 425 555 5678", icpScore: 97, source: "database", tags: ["Big Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Sundar", lastName: "Pichai", title: "CEO", company: "Alphabet", location: "Mountain View, United States", email: "sundar@google.com", phone: "+1 650 555 9012", icpScore: 96, source: "extractor", tags: ["Big Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Dario", lastName: "Amodei", title: "CEO", company: "Anthropic", location: "San Francisco, United States", email: "dario@anthropic.com", phone: null, icpScore: 95, source: "database", tags: ["AI", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Mark", lastName: "Zuckerberg", title: "CEO", company: "Meta", location: "Menlo Park, United States", email: null, phone: "+1 650 555 3456", icpScore: 94, source: "database", tags: ["Big Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Elon", lastName: "Musk", title: "CEO & Technoking", company: "Tesla / SpaceX", location: "Austin, United States", email: "elon@tesla.com", phone: "+1 512 555 7890", icpScore: 93, source: "csv", tags: ["Deep Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Sam", lastName: "Altman", title: "CEO", company: "OpenAI", location: "San Francisco, United States", email: "sam@openai.com", phone: null, icpScore: 92, source: "database", tags: ["AI", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Jensen", lastName: "Huang", title: "CEO & Founder", company: "NVIDIA", location: "Santa Clara, United States", email: "jhuang@nvidia.com", phone: "+1 408 555 2345", icpScore: 91, source: "extractor", tags: ["Semiconductors", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Lisa", lastName: "Su", title: "CEO", company: "AMD", location: "Santa Clara, United States", email: "lisa.su@amd.com", phone: null, icpScore: 90, source: "database", tags: ["Semiconductors", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Andy", lastName: "Jassy", title: "CEO", company: "Amazon", location: "Seattle, United States", email: "ajassy@amazon.com", phone: "+1 206 555 6789", icpScore: 89, source: "database", tags: ["Big Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Sheryl", lastName: "Sandberg", title: "Board Director", company: "Meta", location: "Menlo Park, United States", email: "sheryl@meta.com", phone: "+1 650 555 0199", icpScore: 88, source: "database", tags: ["Big Tech", "C-Suite"], enrichmentStatus: "enriched" },
    { firstName: "Brian", lastName: "Chesky", title: "CEO & Co-Founder", company: "Airbnb", location: "San Francisco, United States", email: null, phone: null, icpScore: 87, source: "extractor", tags: ["Travel Tech", "CEO"], enrichmentStatus: "pending" },
    { firstName: "Marc", lastName: "Benioff", title: "CEO & Co-Founder", company: "Salesforce", location: "San Francisco, United States", email: "marc@salesforce.com", phone: null, icpScore: 86, source: "database", tags: ["Enterprise SaaS", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Daniel", lastName: "Ek", title: "CEO & Co-Founder", company: "Spotify", location: "Stockholm, Sweden", email: "daniel@spotify.com", phone: "+46 70 555 0177", icpScore: 85, source: "csv", tags: ["Music Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Jack", lastName: "Dorsey", title: "CEO", company: "Block", location: "San Francisco, United States", email: "jack@block.xyz", phone: null, icpScore: 84, source: "database", tags: ["FinTech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Patrick", lastName: "Collison", title: "CEO & Co-Founder", company: "Stripe", location: "San Francisco, United States", email: "patrick@stripe.com", phone: "+1 415 555 8899", icpScore: 83, source: "database", tags: ["FinTech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Tobi", lastName: "Lütke", title: "CEO & Founder", company: "Shopify", location: "Ottawa, Canada", email: "tobi@shopify.com", phone: null, icpScore: 82, source: "extractor", tags: ["E-Commerce", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Reed", lastName: "Hastings", title: "Co-Founder & Executive Chairman", company: "Netflix", location: "Los Gatos, United States", email: null, phone: null, icpScore: 81, source: "database", tags: ["Streaming", "Founder"], enrichmentStatus: "pending" },
    { firstName: "Stewart", lastName: "Butterfield", title: "Co-Founder", company: "Slack", location: "San Francisco, United States", email: "stewart@slack.com", phone: "+1 415 555 4567", icpScore: 80, source: "database", tags: ["SaaS", "Founder"], enrichmentStatus: "enriched" },
    { firstName: "Drew", lastName: "Houston", title: "CEO & Co-Founder", company: "Dropbox", location: "San Francisco, United States", email: "drew@dropbox.com", phone: null, icpScore: 79, source: "database", tags: ["SaaS", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Marissa", lastName: "Mayer", title: "CEO & Co-Founder", company: "Sunshine", location: "Palo Alto, United States", email: "marissa@sunshine.com", phone: "+1 650 555 6780", icpScore: 78, source: "csv", tags: ["Tech", "CEO"], enrichmentStatus: "enriched" },
    { firstName: "Jeff", lastName: "Bezos", title: "Executive Chairman", company: "Amazon", location: "Miami, United States", email: null, phone: null, icpScore: 77, source: "database", tags: ["Big Tech", "Founder"], enrichmentStatus: "pending" },
    { firstName: "Susan", lastName: "Wojcicki", title: "Former CEO", company: "YouTube", location: "San Bruno, United States", email: null, phone: null, icpScore: 76, source: "extractor", tags: ["Big Tech", "Executive"], enrichmentStatus: "pending" },
    { firstName: "Travis", lastName: "Kalanick", title: "Founder", company: "CloudKitchens", location: "Los Angeles, United States", email: "travis@ck.com", phone: "+1 213 555 456", icpScore: 75, source: "database", tags: ["Logistics", "Founder"], enrichmentStatus: "enriched" },
    { firstName: "Ginni", lastName: "Rometty", title: "Former CEO", company: "IBM", location: "New York, United States", email: null, phone: null, icpScore: 74, source: "database", tags: ["Enterprise", "Executive"], enrichmentStatus: "pending" },
  ];

  const leads = await Promise.all(
    leadsData.map((ld) =>
      prisma.lead.create({
        data: {
          workspaceId: wId,
          firstName: ld.firstName,
          lastName: ld.lastName,
          fullName: `${ld.firstName} ${ld.lastName}`,
          title: ld.title,
          company: ld.company,
          location: ld.location,
          email: ld.email,
          phone: ld.phone,
          icpScore: ld.icpScore,
          source: ld.source,
          tags: ld.tags,
          enrichmentStatus: ld.enrichmentStatus,
          linkedinUrl: `https://linkedin.com/in/${ld.firstName.toLowerCase()}${ld.lastName.toLowerCase()}`,
        },
      })
    )
  );

  const leadMap = new Map<string, (typeof leads)[0]>();
  for (const lead of leads) {
    leadMap.set(lead.fullName ?? "", lead);
  }

  console.log(`Leads: ${leads.length}`);

  // ── 8. Messages (Unibox conversations) ────────────────
  const darioLead = leadMap.get("Elian Cross")!;
  const markLead = leadMap.get("Adrian Voss")!;
  const sherylLead = leadMap.get("Rachel Voss")!;
  const sundarLead = leadMap.get("Arvind Mehta")!;
  const susanLead = leadMap.get("Elena Ward")!;
  const timLead = leadMap.get("Marcus Reyes")!;
  const satyaLead = leadMap.get("Devansh Rao")!;
  const marcLead = leadMap.get("Victor Lane")!;

  const now = new Date();
  const minutesAgo = (m: number): Date => new Date(now.getTime() - m * 60 * 1000);
  const hoursAgo = (h: number): Date => new Date(now.getTime() - h * 3600 * 1000);
  const daysAgo = (d: number): Date => new Date(now.getTime() - d * 86400 * 1000);

  // Elian Cross conversation (6 messages)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "sent", content: "Hi Dario! I came across Anthropic and I'm really impressed with the safety-first approach to AI. I'm building an AI-powered LinkedIn automation platform and would love to get your thoughts.", messageType: "connection_request", read: true, sentAt: daysAgo(1) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "received", content: "Hey Said! Thanks for reaching out. Always interesting to hear about new tools in this space. What makes yours different?", messageType: "text", read: true, sentAt: new Date(daysAgo(1).getTime() + 4 * 3600 * 1000) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "sent", content: "Great question! Three key differentiators:\n\n1. AI-powered ICP scoring — we use Claude to research each lead and score 0-100 based on your ideal customer profile\n2. Visual sequence builder — bug-free node-based flow editor (biggest complaint about competitors)\n3. All-in-one: outreach + content + inbox in one dashboard\n\nWould love to show you a quick demo.", messageType: "text", read: true, sentAt: new Date(daysAgo(1).getTime() + 5.25 * 3600 * 1000) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "received", content: "Those are solid differentiators. The ICP scoring sounds particularly interesting. How accurate is it?", messageType: "text", read: true, sentAt: minutesAgo(120) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "sent", content: "We're seeing 85%+ accuracy in beta testing. The Claude API does deep research on each lead — checking their company size, industry, role seniority, and recent activity. Leads below your threshold get automatically filtered out before entering the sequence.", messageType: "text", read: true, sentAt: minutesAgo(90) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: darioLead.id, campaignId: campSaaS.id, direction: "received", content: "That sounds great! Let's set up a call next week.", messageType: "text", read: false, sentAt: minutesAgo(2) },
    ],
  });

  // Adrian Voss conversation (2 messages)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: markLead.id, campaignId: campAgency.id, direction: "sent", content: "Hi Mark! Big fan of what you're building at Meta. Would love to connect and exchange ideas on AI-powered outreach.", messageType: "connection_request", read: true, sentAt: minutesAgo(30) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: markLead.id, campaignId: campAgency.id, direction: "received", content: "Thanks for reaching out! I'm curious about what you're building.", messageType: "text", read: false, sentAt: minutesAgo(15) },
    ],
  });

  // Rachel Voss (1 received)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: sherylLead.id, campaignId: campB2B.id, direction: "received", content: "I'll check with my team and get back to you by Friday.", messageType: "text", read: true, sentAt: hoursAgo(1) },
    ],
  });

  // Arvind Mehta (1 sent)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: sundarLead.id, campaignId: campSaaS.id, direction: "sent", content: "Hi Sundar, I wanted to follow up on our conversation last week. Are you still interested in exploring this further?", messageType: "text", read: true, sentAt: hoursAgo(3) },
    ],
  });

  // Elena Ward (1 received, negative)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: susanLead.id, campaignId: campDACH.id, direction: "received", content: "Not interested at the moment, but feel free to reach out again next quarter.", messageType: "text", read: true, sentAt: daysAgo(1) },
    ],
  });

  // Marcus Reyes conversation (4 messages, starred)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: timLead.id, campaignId: campSeries.id, direction: "sent", content: "Hi Tim, I saw your keynote about innovation at scale — really resonated with my experience. We've built a tool that automates the entire outreach process.", messageType: "connection_request", read: true, starred: true, sentAt: daysAgo(3) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: timLead.id, campaignId: campSeries.id, direction: "received", content: "Hey! Yeah that post got a lot of traction. What tool are you building?", messageType: "text", read: true, starred: true, sentAt: daysAgo(2) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: timLead.id, campaignId: campSeries.id, direction: "sent", content: "It's called Velaris — think of it as the all-in-one LinkedIn automation platform. AI content generation, smart sequences, unified inbox, and advanced lead search. All in one dashboard.", messageType: "text", read: true, sentAt: new Date(daysAgo(2).getTime() + 1.5 * 3600 * 1000) },
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: timLead.id, campaignId: campSeries.id, direction: "received", content: "Absolutely, I'd love to see a demo. Can you send me a link?", messageType: "text", read: true, sentAt: daysAgo(1) },
    ],
  });

  // Devansh Rao (1 received)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: satyaLead.id, direction: "received", content: "Thanks for connecting! How can I help?", messageType: "text", read: true, sentAt: daysAgo(2) },
    ],
  });

  // Victor Lane (1 received)
  await prisma.message.createMany({
    data: [
      { workspaceId: wId, linkedinAccountId: accSaid.id, leadId: marcLead.id, campaignId: campAgency.id, direction: "received", content: "Connection accepted", messageType: "text", read: true, sentAt: daysAgo(3) },
    ],
  });

  console.log("Messages created");

  // ── 9. Content Posts ──────────────────────────────────
  await prisma.contentPost.createMany({
    data: [
      { workspaceId: wId, category: "Thought Leadership", topic: "LinkedIn outreach analysis", targetAudience: "SaaS founders", language: "en", tone: "educational", generatedContent: "I spent 6 months analyzing 10,000+ LinkedIn outreach campaigns. Here's what actually works in 2026...", status: "posted", postedAt: new Date("2026-03-03T09:00:00"), linkedinAccountId: accSaid.id, createdAt: new Date("2026-03-02") },
      { workspaceId: wId, category: "Hot Takes", topic: "LinkedIn outreach quality", targetAudience: "Sales professionals", language: "en", tone: "controversial", generatedContent: "Hot take: 90% of LinkedIn outreach messages are garbage. Here's why yours might be too...", status: "scheduled", scheduledAt: new Date("2026-03-07T10:00:00"), linkedinAccountId: accSaid.id, createdAt: new Date("2026-03-05") },
      { workspaceId: wId, category: "Personal Story", topic: "SaaS journey lessons", targetAudience: "Entrepreneurs", language: "en", tone: "storytelling", generatedContent: "3 things I wish I knew before starting my SaaS journey. Thread...", status: "draft", createdAt: new Date("2026-03-06") },
      { workspaceId: wId, category: "Milestone", topic: "MRR achievement", targetAudience: "SaaS founders", language: "en", tone: "inspirational", generatedContent: "We just hit $10K MRR. Here's the breakdown of how we got there...", status: "posted", postedAt: new Date("2026-02-28T11:30:00"), linkedinAccountId: accSaid.id, createdAt: new Date("2026-02-27") },
      { workspaceId: wId, category: "Advice", topic: "Best investment", targetAudience: "Founders", language: "en", tone: "professional", generatedContent: "The single best investment I made this year was dedicating 2 hours daily to LinkedIn content...", status: "posted", postedAt: new Date("2026-02-20T09:15:00"), linkedinAccountId: accSaid.id, createdAt: new Date("2026-02-19") },
    ],
  });

  console.log("Content posts created");

  // ── 10. Inbound Automations ───────────────────────────
  const automation1 = await prisma.inboundAutomation.create({
    data: {
      workspaceId: wId,
      name: "Lead Magnet \u2014 LinkedIn Playbook",
      postUrl: "https://www.linkedin.com/posts/saidborna_linkedin-playbook-123",
      status: "active",
      triggerKeywords: ["playbook", "guide", "send", "interested", "want"],
      autoReplyComment: "Sent it!",
      autoDmMessage: "Hey {firstName}! Here's the LinkedIn Playbook you requested: https://example.com/playbook\n\nLet me know if you have any questions!",
      triggersCount: 147,
      createdAt: new Date("2026-02-28"),
    },
  });

  const automation2 = await prisma.inboundAutomation.create({
    data: {
      workspaceId: wId,
      name: "Free Audit \u2014 Agency Owners",
      postUrl: "https://www.linkedin.com/posts/saidborna_free-audit-456",
      status: "active",
      triggerKeywords: ["audit", "free", "yes", "me", "interested"],
      autoReplyComment: "You got it!",
      autoDmMessage: "Hi {firstName}! Thanks for your interest in our free audit.\n\nI'd love to learn more about your agency. Can we book a quick 15-min call this week?",
      triggersCount: 88,
      createdAt: new Date("2026-03-01"),
    },
  });

  const automation3 = await prisma.inboundAutomation.create({
    data: {
      workspaceId: wId,
      name: "Content Calendar Template",
      postUrl: "https://www.linkedin.com/posts/saidborna_content-calendar-789",
      status: "paused",
      triggerKeywords: ["template", "calendar", "send", "please"],
      autoReplyComment: "Sent it!",
      autoDmMessage: "Hey {firstName}! Here's the content calendar template: https://example.com/calendar\n\nHope it helps!",
      triggersCount: 57,
      createdAt: new Date("2026-03-03"),
    },
  });

  // Link accounts to automations
  await prisma.inboundAutomationAccount.createMany({
    data: [
      { automationId: automation1.id, linkedinAccountId: accSaid.id },
      { automationId: automation1.id, linkedinAccountId: accElon.id },
      { automationId: automation2.id, linkedinAccountId: accSaid.id },
      { automationId: automation3.id, linkedinAccountId: accSaid.id },
      { automationId: automation3.id, linkedinAccountId: accSam.id },
    ],
  });

  console.log("Inbound automations created");

  // ── 11. Activity Log ──────────────────────────────────
  const activities = [
    { action: "opportunity_created", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: darioLead.id, metadata: { value: 12400 }, createdAt: minutesAgo(2) },
    { action: "connection_sent", linkedinAccountId: accElon.id, campaignId: campSaaS.id, leadId: null as string | null, metadata: { count: 12 }, createdAt: minutesAgo(9) },
    { action: "reply_received", linkedinAccountId: accSam.id, campaignId: campSaaS.id, leadId: darioLead.id, metadata: { count: 4 }, createdAt: minutesAgo(14) },
    { action: "connection_accepted", linkedinAccountId: accJensen.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 7 }, createdAt: minutesAgo(26) },
    { action: "message_sent", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 15 }, createdAt: minutesAgo(35) },
    { action: "connection_sent", linkedinAccountId: accSaid.id, campaignId: campB2B.id, leadId: null as string | null, metadata: { count: 8 }, createdAt: minutesAgo(45) },
    { action: "reply_received", linkedinAccountId: accElon.id, campaignId: campSaaS.id, leadId: markLead.id, metadata: { count: 2 }, createdAt: hoursAgo(1) },
    { action: "opportunity_created", linkedinAccountId: accSaid.id, campaignId: campSeries.id, leadId: timLead.id, metadata: { value: 8500 }, createdAt: hoursAgo(2) },
    { action: "connection_accepted", linkedinAccountId: accSam.id, campaignId: campHR.id, leadId: null as string | null, metadata: { count: 5 }, createdAt: hoursAgo(3) },
    { action: "message_sent", linkedinAccountId: accElon.id, campaignId: campEcom.id, leadId: null as string | null, metadata: { count: 10 }, createdAt: hoursAgo(4) },
    { action: "connection_sent", linkedinAccountId: accJensen.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 20 }, createdAt: hoursAgo(6) },
    { action: "reply_received", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: sherylLead.id, metadata: { count: 3 }, createdAt: hoursAgo(8) },
    { action: "connection_accepted", linkedinAccountId: accSaid.id, campaignId: campSaaS.id, leadId: null as string | null, metadata: { count: 12 }, createdAt: hoursAgo(12) },
    { action: "message_sent", linkedinAccountId: accSam.id, campaignId: campHR.id, leadId: null as string | null, metadata: { count: 8 }, createdAt: daysAgo(1) },
    { action: "opportunity_created", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: marcLead.id, metadata: { value: 15000 }, createdAt: daysAgo(1) },
    { action: "connection_sent", linkedinAccountId: accElon.id, campaignId: campEcom.id, leadId: null as string | null, metadata: { count: 15 }, createdAt: daysAgo(1) },
    { action: "reply_received", linkedinAccountId: accSaid.id, campaignId: campB2B.id, leadId: susanLead.id, metadata: { count: 1 }, createdAt: daysAgo(2) },
    { action: "connection_accepted", linkedinAccountId: accElon.id, campaignId: campSaaS.id, leadId: null as string | null, metadata: { count: 9 }, createdAt: daysAgo(2) },
    { action: "message_sent", linkedinAccountId: accSaid.id, campaignId: campSeries.id, leadId: null as string | null, metadata: { count: 22 }, createdAt: daysAgo(3) },
    { action: "connection_sent", linkedinAccountId: accSam.id, campaignId: campHR.id, leadId: null as string | null, metadata: { count: 6 }, createdAt: daysAgo(3) },
    { action: "opportunity_created", linkedinAccountId: accSaid.id, campaignId: campSaaS.id, leadId: sundarLead.id, metadata: { value: 22000 }, createdAt: daysAgo(4) },
    { action: "reply_received", linkedinAccountId: accJensen.id, campaignId: campAgency.id, leadId: satyaLead.id, metadata: { count: 2 }, createdAt: daysAgo(5) },
    { action: "connection_accepted", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 18 }, createdAt: daysAgo(7) },
    { action: "message_sent", linkedinAccountId: accElon.id, campaignId: campSaaS.id, leadId: null as string | null, metadata: { count: 14 }, createdAt: daysAgo(10) },
    { action: "connection_sent", linkedinAccountId: accSaid.id, campaignId: campSeries.id, leadId: null as string | null, metadata: { count: 30 }, createdAt: daysAgo(14) },
    { action: "opportunity_created", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: leads[14].id, metadata: { value: 9800 }, createdAt: daysAgo(18) },
    { action: "reply_received", linkedinAccountId: accSaid.id, campaignId: campSaaS.id, leadId: leads[15].id, metadata: { count: 5 }, createdAt: daysAgo(21) },
    { action: "connection_accepted", linkedinAccountId: accElon.id, campaignId: campEcom.id, leadId: null as string | null, metadata: { count: 11 }, createdAt: daysAgo(25) },
    { action: "message_sent", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 25 }, createdAt: daysAgo(28) },
    { action: "connection_sent", linkedinAccountId: accSaid.id, campaignId: campAgency.id, leadId: null as string | null, metadata: { count: 35 }, createdAt: daysAgo(30) },
  ];

  await prisma.activityLog.createMany({
    data: activities.map((a) => ({
      workspaceId: wId,
      linkedinAccountId: a.linkedinAccountId,
      campaignId: a.campaignId,
      leadId: a.leadId ?? null,
      action: a.action,
      metadata: a.metadata as Prisma.InputJsonValue,
      createdAt: a.createdAt,
    })),
  });

  console.log(`Activity log: ${activities.length} entries`);
  console.log("\nSeed complete — demo workspace fully populated!");
}

main()
  .catch((e: Error) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
