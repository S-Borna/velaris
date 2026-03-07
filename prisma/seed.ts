// Copyright (c) Said Borna. All rights reserved.
// Velaris — Database seed script for demo data
// Usage: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Constants ──────────────────────────────────────────

const SALT_ROUNDS = 12;
const DEMO_EMAIL = "said@saidborna.com";
const DEMO_PASSWORD = "REDACTED-PASSWORD";

// Deterministic UUIDs for stable references
const USER_ID = "a0000000-0000-4000-8000-000000000001";
const WORKSPACE_ID = "b0000000-0000-4000-8000-000000000001";

const LINKEDIN_ACCOUNTS = {
    said: "c0000000-0000-4000-8000-000000000001",
    elliot: "c0000000-0000-4000-8000-000000000002",
    oskar: "c0000000-0000-4000-8000-000000000003",
    maria: "c0000000-0000-4000-8000-000000000004",
};

const CAMPAIGNS = {
    agencyOutreach: "d0000000-0000-4000-8000-000000000001",
    saasFounders: "d0000000-0000-4000-8000-000000000002",
    recruiters: "d0000000-0000-4000-8000-000000000003",
    nordicCeos: "d0000000-0000-4000-8000-000000000004",
    aiStartups: "d0000000-0000-4000-8000-000000000005",
    ecommerce: "d0000000-0000-4000-8000-000000000006",
};

/** Generate deterministic lead IDs. */
function leadId(index: number): string {
    const hex = index.toString(16).padStart(12, "0");
    return `e0000000-0000-4000-8000-${hex}`;
}

// ─── Lead Data ──────────────────────────────────────────

interface LeadData {
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    companySize: string;
    industry: string;
    location: string;
    email: string;
    icpScore: number;
    source: string;
}

const LEAD_DATA: LeadData[] = [
    { firstName: "Marcus", lastName: "Lindqvist", title: "CEO & Founder", company: "Nordhaven Digital", companySize: "11-50", industry: "Marketing Agency", location: "Stockholm, Sweden", email: "marcus@nordhaven.se", icpScore: 95, source: "extractor" },
    { firstName: "Sofia", lastName: "Bergström", title: "Head of Growth", company: "Scaleup Nordic", companySize: "51-200", industry: "SaaS", location: "Gothenburg, Sweden", email: "sofia@scaleupnordic.com", icpScore: 92, source: "database" },
    { firstName: "Erik", lastName: "Johansson", title: "VP Sales", company: "CloudVault AB", companySize: "11-50", industry: "Cloud Infrastructure", location: "Malmö, Sweden", email: "erik@cloudvault.se", icpScore: 88, source: "extractor" },
    { firstName: "Anna", lastName: "Nilsson", title: "Co-Founder & COO", company: "FintechFlow", companySize: "11-50", industry: "Fintech", location: "Copenhagen, Denmark", email: "anna@fintechflow.dk", icpScore: 91, source: "csv" },
    { firstName: "Jonas", lastName: "Petersson", title: "Managing Director", company: "Nordic Ventures", companySize: "2-10", industry: "Venture Capital", location: "Stockholm, Sweden", email: "jonas@nordicventures.se", icpScore: 97, source: "database" },
    { firstName: "Emilia", lastName: "Öberg", title: "CEO", company: "BrandSpark Agency", companySize: "11-50", industry: "Digital Marketing", location: "Helsinki, Finland", email: "emilia@brandspark.fi", icpScore: 89, source: "extractor" },
    { firstName: "Oliver", lastName: "Holm", title: "Founder", company: "DataDriven.io", companySize: "2-10", industry: "Data Analytics", location: "Oslo, Norway", email: "oliver@datadriven.io", icpScore: 85, source: "database" },
    { firstName: "Maja", lastName: "Andersson", title: "CMO", company: "Sellio Group", companySize: "51-200", industry: "E-commerce", location: "Stockholm, Sweden", email: "maja@selliogroup.com", icpScore: 78, source: "csv" },
    { firstName: "Gustav", lastName: "Ekström", title: "CTO", company: "DevHouse AB", companySize: "11-50", industry: "Software Development", location: "Lund, Sweden", email: "gustav@devhouse.se", icpScore: 72, source: "extractor" },
    { firstName: "Isabella", lastName: "Svensson", title: "Head of Partnerships", company: "GrowthOS", companySize: "11-50", industry: "SaaS", location: "Stockholm, Sweden", email: "isabella@growthos.com", icpScore: 93, source: "database" },
    { firstName: "Lucas", lastName: "Wallin", title: "CEO", company: "ProspectLab", companySize: "2-10", industry: "Sales Tech", location: "Tampere, Finland", email: "lucas@prospectlab.fi", icpScore: 90, source: "extractor" },
    { firstName: "Ella", lastName: "Larsson", title: "VP Marketing", company: "ShipFast Nordic", companySize: "51-200", industry: "Logistics", location: "Gothenburg, Sweden", email: "ella@shipfastnordic.com", icpScore: 67, source: "csv" },
    { firstName: "Alexander", lastName: "Björk", title: "Founder & CEO", company: "Talently", companySize: "11-50", industry: "HR Tech", location: "Berlin, Germany", email: "alex@talently.de", icpScore: 86, source: "database" },
    { firstName: "Wilma", lastName: "Dahl", title: "Sales Director", company: "MediaPulse", companySize: "11-50", industry: "Media", location: "Stockholm, Sweden", email: "wilma@mediapulse.se", icpScore: 74, source: "extractor" },
    { firstName: "Hugo", lastName: "Lindgren", title: "Co-Founder", company: "PipelineAI", companySize: "2-10", industry: "AI/ML", location: "Stockholm, Sweden", email: "hugo@pipelineai.se", icpScore: 94, source: "database" },
    { firstName: "Astrid", lastName: "Hedlund", title: "Head of Operations", company: "WorkflowHQ", companySize: "11-50", industry: "Productivity", location: "Uppsala, Sweden", email: "astrid@workflowhq.com", icpScore: 81, source: "csv" },
    { firstName: "Oscar", lastName: "Nordin", title: "CEO", company: "LeadEngine", companySize: "11-50", industry: "Marketing Tech", location: "Aarhus, Denmark", email: "oscar@leadengine.dk", icpScore: 87, source: "extractor" },
    { firstName: "Linnea", lastName: "Ström", title: "VP Business Development", company: "NorthStar Consulting", companySize: "51-200", industry: "Consulting", location: "Stockholm, Sweden", email: "linnea@northstarconsulting.se", icpScore: 76, source: "database" },
    { firstName: "Axel", lastName: "Forsberg", title: "Founder", company: "ContentStack", companySize: "2-10", industry: "Content Marketing", location: "Malmö, Sweden", email: "axel@contentstack.se", icpScore: 83, source: "extractor" },
    { firstName: "Saga", lastName: "Engström", title: "Growth Lead", company: "RevOps Nordic", companySize: "11-50", industry: "Revenue Operations", location: "Stockholm, Sweden", email: "saga@revopsnordic.com", icpScore: 91, source: "database" },
    { firstName: "Liam", lastName: "Karlsson", title: "Managing Partner", company: "Apex Partners", companySize: "11-50", industry: "Private Equity", location: "London, UK", email: "liam@apexpartners.co.uk", icpScore: 82, source: "csv" },
    { firstName: "Klara", lastName: "Wikström", title: "CEO", company: "DesignHive", companySize: "2-10", industry: "Design Agency", location: "Stockholm, Sweden", email: "klara@designhive.se", icpScore: 79, source: "extractor" },
    { firstName: "Noah", lastName: "Sjöberg", title: "Head of Sales", company: "SalesForge", companySize: "51-200", industry: "Sales Enablement", location: "Oslo, Norway", email: "noah@salesforge.no", icpScore: 88, source: "database" },
    { firstName: "Ebba", lastName: "Lund", title: "Co-Founder", company: "AI Nordic Labs", companySize: "11-50", industry: "Artificial Intelligence", location: "Helsinki, Finland", email: "ebba@ainordiclabs.fi", icpScore: 96, source: "extractor" },
    { firstName: "William", lastName: "Sandberg", title: "VP Product", company: "PixelPerfect", companySize: "11-50", industry: "Design Tools", location: "Copenhagen, Denmark", email: "william@pixelperfect.dk", icpScore: 71, source: "csv" },
    { firstName: "Alma", lastName: "Gustafsson", title: "Chief Revenue Officer", company: "CloudBridge", companySize: "201-500", industry: "Cloud Services", location: "Stockholm, Sweden", email: "alma@cloudbridge.se", icpScore: 84, source: "database" },
    { firstName: "Elias", lastName: "Olsson", title: "Founder & CTO", company: "AutomateNow", companySize: "2-10", industry: "Automation", location: "Gothenburg, Sweden", email: "elias@automatenow.se", icpScore: 90, source: "extractor" },
    { firstName: "Vera", lastName: "Åström", title: "Marketing Director", company: "Nordic Impact", companySize: "11-50", industry: "Impact Investing", location: "Stockholm, Sweden", email: "vera@nordicimpact.se", icpScore: 77, source: "database" },
    { firstName: "Leo", lastName: "Henriksson", title: "CEO", company: "FinanceFlow", companySize: "11-50", industry: "Fintech", location: "Zurich, Switzerland", email: "leo@financeflow.ch", icpScore: 93, source: "csv" },
    { firstName: "Ines", lastName: "Magnusson", title: "Head of Growth", company: "HyperScale AB", companySize: "51-200", industry: "SaaS", location: "Stockholm, Sweden", email: "ines@hyperscale.se", icpScore: 89, source: "extractor" },
    { firstName: "Theo", lastName: "Nyström", title: "Founder", company: "AdTech Solutions", companySize: "2-10", industry: "Advertising Tech", location: "Malmö, Sweden", email: "theo@adtechsolutions.se", icpScore: 75, source: "database" },
    { firstName: "Selma", lastName: "Blomqvist", title: "VP Strategy", company: "Bright Consulting", companySize: "51-200", industry: "Management Consulting", location: "Oslo, Norway", email: "selma@brightconsulting.no", icpScore: 80, source: "csv" },
    { firstName: "Filip", lastName: "Persson", title: "CEO", company: "TechRecruit", companySize: "11-50", industry: "Recruitment", location: "Stockholm, Sweden", email: "filip@techrecruit.se", icpScore: 86, source: "extractor" },
    { firstName: "Lova", lastName: "Eriksson", title: "Co-Founder & CEO", company: "Social Boost", companySize: "2-10", industry: "Social Media Marketing", location: "Gothenburg, Sweden", email: "lova@socialboost.se", icpScore: 92, source: "database" },
    { firstName: "Felix", lastName: "Sundberg", title: "Business Development Manager", company: "NovaTech", companySize: "51-200", industry: "IT Services", location: "Stockholm, Sweden", email: "felix@novatech.se", icpScore: 73, source: "csv" },
    { firstName: "Tilde", lastName: "Fransson", title: "CEO", company: "EcoGrowth", companySize: "11-50", industry: "Sustainability", location: "Copenhagen, Denmark", email: "tilde@ecogrowth.dk", icpScore: 68, source: "extractor" },
    { firstName: "Nils", lastName: "Ahlström", title: "Product Lead", company: "FlowState", companySize: "11-50", industry: "Productivity SaaS", location: "Stockholm, Sweden", email: "nils@flowstate.se", icpScore: 87, source: "database" },
    { firstName: "Liv", lastName: "Håkansson", title: "Head of Digital", company: "Myriad Agency", companySize: "11-50", industry: "Creative Agency", location: "Malmö, Sweden", email: "liv@myriadagency.se", icpScore: 81, source: "extractor" },
    { firstName: "Anton", lastName: "Claesson", title: "VP Engineering", company: "ScalePilot", companySize: "11-50", industry: "DevOps", location: "Helsinki, Finland", email: "anton@scalepilot.fi", icpScore: 69, source: "csv" },
    { firstName: "Stella", lastName: "Berglund", title: "CEO & Founder", company: "InsightHQ", companySize: "2-10", industry: "Business Intelligence", location: "Stockholm, Sweden", email: "stella@insighthq.se", icpScore: 94, source: "database" },
    { firstName: "Melvin", lastName: "Skog", title: "Managing Director", company: "Nordic Partners", companySize: "11-50", industry: "Consulting", location: "Stockholm, Sweden", email: "melvin@nordicpartners.se", icpScore: 83, source: "extractor" },
    { firstName: "Tuva", lastName: "Jonsson", title: "Growth Manager", company: "Scale Nordic", companySize: "11-50", industry: "Growth Consulting", location: "Oslo, Norway", email: "tuva@scalenordic.no", icpScore: 88, source: "database" },
    { firstName: "Isak", lastName: "Lindström", title: "Founder", company: "ReachOut.ai", companySize: "2-10", industry: "Outreach Tech", location: "Stockholm, Sweden", email: "isak@reachout.ai", icpScore: 95, source: "extractor" },
    { firstName: "Freja", lastName: "Hellström", title: "Chief of Staff", company: "Velocity Group", companySize: "51-200", industry: "Tech Holding", location: "Stockholm, Sweden", email: "freja@velocitygroup.se", icpScore: 79, source: "csv" },
    { firstName: "Edvin", lastName: "Månsson", title: "CEO", company: "PropTech Nordic", companySize: "11-50", industry: "Real Estate Tech", location: "Gothenburg, Sweden", email: "edvin@proptechnordic.se", icpScore: 74, source: "database" },
    { firstName: "Sigrid", lastName: "Norberg", title: "VP Sales EMEA", company: "EnterpriseHub", companySize: "201-500", industry: "Enterprise Software", location: "Munich, Germany", email: "sigrid@enterprisehub.de", icpScore: 85, source: "extractor" },
    { firstName: "Ludvig", lastName: "Dahlgren", title: "Founder & CEO", company: "HealthTech AB", companySize: "11-50", industry: "Health Tech", location: "Lund, Sweden", email: "ludvig@healthtech.se", icpScore: 76, source: "csv" },
    { firstName: "Meja", lastName: "Eliasson", title: "Growth Lead", company: "Demand Gen Co", companySize: "2-10", industry: "Demand Generation", location: "Stockholm, Sweden", email: "meja@demandgenco.se", icpScore: 91, source: "database" },
    { firstName: "Arvid", lastName: "Söderström", title: "Head of Partnerships", company: "B2B Nordic", companySize: "11-50", industry: "B2B Marketplace", location: "Stockholm, Sweden", email: "arvid@b2bnordic.se", icpScore: 82, source: "extractor" },
    { firstName: "Tyra", lastName: "Moberg", title: "CEO", company: "FemTech Labs", companySize: "2-10", industry: "FemTech", location: "Stockholm, Sweden", email: "tyra@femtechlabs.se", icpScore: 70, source: "database" },
];

// ─── Helper Functions ───────────────────────────────────

/** Return a Date that is N days before now. */
function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

/** Return a Date that is N hours before now (negative = future). */
function hoursAgo(hours: number): Date {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
}

/** Random integer between min and max inclusive. */
function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Main Seed Function ─────────────────────────────────

async function main(): Promise<void> {
    console.log("🌱 Seeding Velaris demo data...\n");

    // 1. User
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
    });

    let actualUserId: string;

    if (existingUser) {
        // Update existing user's password
        await prisma.user.update({
            where: { email: DEMO_EMAIL },
            data: { passwordHash, fullName: "Said Borna" },
        });
        actualUserId = existingUser.id;
        console.log(`✅ User: ${DEMO_EMAIL} (updated existing)`);
    } else {
        // Create new user with deterministic ID
        await prisma.user.create({
            data: {
                id: USER_ID,
                email: DEMO_EMAIL,
                passwordHash,
                fullName: "Said Borna",
                emailVerified: new Date(),
            },
        });
        actualUserId = USER_ID;
        console.log(`✅ User: ${DEMO_EMAIL} (created)`);
    }

    // 2. Workspace — find existing or create
    let actualWorkspaceId: string;

    if (existingUser) {
        // Check for existing workspace membership
        const membership = await prisma.workspaceMember.findFirst({
            where: { userId: actualUserId },
        });
        if (membership) {
            actualWorkspaceId = membership.workspaceId;
            await prisma.workspace.update({
                where: { id: actualWorkspaceId },
                data: { name: "Velaris HQ", plan: "team" },
            });
            console.log("✅ Workspace: Velaris HQ (updated existing)");
        } else {
            const ws = await prisma.workspace.create({
                data: { id: WORKSPACE_ID, name: "Velaris HQ", plan: "team" },
            });
            actualWorkspaceId = ws.id;
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: actualWorkspaceId,
                    userId: actualUserId,
                    role: "owner",
                },
            });
            console.log("✅ Workspace: Velaris HQ (created)");
        }
    } else {
        const ws = await prisma.workspace.create({
            data: { id: WORKSPACE_ID, name: "Velaris HQ", plan: "team" },
        });
        actualWorkspaceId = ws.id;
        await prisma.workspaceMember.create({
            data: {
                workspaceId: actualWorkspaceId,
                userId: actualUserId,
                role: "owner",
            },
        });
        console.log("✅ Workspace: Velaris HQ (created)");
    }

    // ─── Clean existing demo data in this workspace ─────
    console.log("\n🧹 Cleaning old demo data...");
    await prisma.activityLog.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.message.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.campaignLead.deleteMany({
        where: { campaign: { workspaceId: actualWorkspaceId } },
    });
    await prisma.sequence.deleteMany({
        where: { campaign: { workspaceId: actualWorkspaceId } },
    });
    await prisma.icpConfig.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.contentPost.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.inboundAutomation.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.campaign.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.lead.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    await prisma.linkedinAccount.deleteMany({ where: { workspaceId: actualWorkspaceId } });
    console.log("   Done.\n");

    // 3. LinkedIn Accounts
    const linkedinAccountData = [
        {
            id: LINKEDIN_ACCOUNTS.said,
            accountName: "Said Borna",
            linkedinUrl: "https://linkedin.com/in/saidborna",
            status: "connected",
            accountType: "premium",
            dailyConnectionLimit: 30,
            dailyMessageLimit: 80,
            dailyConnectionsUsed: 18,
            dailyMessagesUsed: 42,
            lastSyncAt: hoursAgo(1),
        },
        {
            id: LINKEDIN_ACCOUNTS.elliot,
            accountName: "[redacted]",
            linkedinUrl: "https://linkedin.com/in/elliotnestenborg",
            status: "connected",
            accountType: "sales_navigator",
            dailyConnectionLimit: 40,
            dailyMessageLimit: 100,
            dailyConnectionsUsed: 28,
            dailyMessagesUsed: 67,
            lastSyncAt: hoursAgo(2),
        },
        {
            id: LINKEDIN_ACCOUNTS.oskar,
            accountName: "[redacted]",
            linkedinUrl: "https://linkedin.com/in/oskarmoen",
            status: "connected",
            accountType: "basic",
            dailyConnectionLimit: 20,
            dailyMessageLimit: 50,
            dailyConnectionsUsed: 12,
            dailyMessagesUsed: 31,
            lastSyncAt: hoursAgo(3),
        },
        {
            id: LINKEDIN_ACCOUNTS.maria,
            accountName: "Maria Svensson",
            linkedinUrl: "https://linkedin.com/in/mariasvensson",
            status: "disconnected",
            accountType: "basic",
            dailyConnectionLimit: 20,
            dailyMessageLimit: 50,
            dailyConnectionsUsed: 0,
            dailyMessagesUsed: 0,
            lastSyncAt: daysAgo(5),
        },
    ];

    for (const acc of linkedinAccountData) {
        await prisma.linkedinAccount.create({
            data: { ...acc, workspaceId: actualWorkspaceId },
        });
    }
    console.log("✅ LinkedIn Accounts: 4 (3 connected, 1 disconnected)");

    // 4. Campaigns
    const campaignData = [
        {
            id: CAMPAIGNS.agencyOutreach,
            name: "Agency Owners Outreach Q1",
            status: "active",
            totalLeads: 245,
            connectionsSent: 632,
            connectionsAccepted: 348,
            messagesSent: 1162,
            repliesReceived: 278,
            opportunitiesValue: 86200,
            createdAt: daysAgo(42),
        },
        {
            id: CAMPAIGNS.saasFounders,
            name: "SaaS Founders — Nordic",
            status: "active",
            totalLeads: 180,
            connectionsSent: 420,
            connectionsAccepted: 231,
            messagesSent: 815,
            repliesReceived: 196,
            opportunitiesValue: 54800,
            createdAt: daysAgo(28),
        },
        {
            id: CAMPAIGNS.recruiters,
            name: "Tech Recruiters Europe",
            status: "paused",
            totalLeads: 310,
            connectionsSent: 890,
            connectionsAccepted: 412,
            messagesSent: 1540,
            repliesReceived: 245,
            opportunitiesValue: 32100,
            createdAt: daysAgo(56),
        },
        {
            id: CAMPAIGNS.nordicCeos,
            name: "Nordic CEOs — Series A+",
            status: "active",
            totalLeads: 95,
            connectionsSent: 210,
            connectionsAccepted: 142,
            messagesSent: 380,
            repliesReceived: 98,
            opportunitiesValue: 124500,
            createdAt: daysAgo(21),
        },
        {
            id: CAMPAIGNS.aiStartups,
            name: "AI Startup Founders",
            status: "completed",
            totalLeads: 150,
            connectionsSent: 380,
            connectionsAccepted: 195,
            messagesSent: 720,
            repliesReceived: 168,
            opportunitiesValue: 41900,
            createdAt: daysAgo(70),
        },
        {
            id: CAMPAIGNS.ecommerce,
            name: "E-commerce Growth Leads",
            status: "draft",
            totalLeads: 0,
            connectionsSent: 0,
            connectionsAccepted: 0,
            messagesSent: 0,
            repliesReceived: 0,
            opportunitiesValue: 0,
            createdAt: daysAgo(2),
        },
    ];

    for (const camp of campaignData) {
        await prisma.campaign.create({
            data: {
                ...camp,
                workspaceId: actualWorkspaceId,
                scheduleTimezone: "Europe/Stockholm",
                scheduleStartHour: 9,
                scheduleEndHour: 17,
                scheduleDays: ["mon", "tue", "wed", "thu", "fri"],
            },
        });
    }
    console.log("✅ Campaigns: 6 (3 active, 1 paused, 1 completed, 1 draft)");

    // 5. Campaign-Account links
    const campaignAccountLinks = [
        { campaignId: CAMPAIGNS.agencyOutreach, linkedinAccountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.agencyOutreach, linkedinAccountId: LINKEDIN_ACCOUNTS.elliot },
        { campaignId: CAMPAIGNS.saasFounders, linkedinAccountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.saasFounders, linkedinAccountId: LINKEDIN_ACCOUNTS.oskar },
        { campaignId: CAMPAIGNS.recruiters, linkedinAccountId: LINKEDIN_ACCOUNTS.elliot },
        { campaignId: CAMPAIGNS.nordicCeos, linkedinAccountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.aiStartups, linkedinAccountId: LINKEDIN_ACCOUNTS.oskar },
        { campaignId: CAMPAIGNS.aiStartups, linkedinAccountId: LINKEDIN_ACCOUNTS.elliot },
    ];

    for (const link of campaignAccountLinks) {
        await prisma.$executeRawUnsafe(
            `INSERT INTO campaign_accounts (campaign_id, linkedin_account_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT DO NOTHING`,
            link.campaignId,
            link.linkedinAccountId,
        );
    }
    console.log("✅ Campaign-Account links: 8");

    // 6. Leads
    for (let i = 0; i < LEAD_DATA.length; i++) {
        const lead = LEAD_DATA[i];
        await prisma.lead.create({
            data: {
                id: leadId(i + 1),
                workspaceId: actualWorkspaceId,
                firstName: lead.firstName,
                lastName: lead.lastName,
                fullName: `${lead.firstName} ${lead.lastName}`,
                linkedinUrl: `https://linkedin.com/in/${lead.firstName.toLowerCase()}${lead.lastName.toLowerCase()}`,
                email: lead.email,
                title: lead.title,
                company: lead.company,
                companySize: lead.companySize,
                industry: lead.industry,
                location: lead.location,
                headline: `${lead.title} at ${lead.company}`,
                icpScore: lead.icpScore,
                tags: [lead.industry, lead.location.split(",")[0].trim()],
                source: lead.source,
                enrichmentStatus: "enriched",
                createdAt: daysAgo(randomBetween(5, 60)),
            },
        });
    }
    console.log(`✅ Leads: ${LEAD_DATA.length}`);

    // 7. Campaign-Leads
    const campaignLeadStatuses = [
        "pending", "connection_sent", "connected", "messaged",
        "replied", "opportunity", "not_interested",
    ];

    const campaignLeadAssignments = [
        { campaignId: CAMPAIGNS.agencyOutreach, leadIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], accountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.saasFounders, leadIndices: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], accountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.recruiters, leadIndices: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30], accountId: LINKEDIN_ACCOUNTS.elliot },
        { campaignId: CAMPAIGNS.nordicCeos, leadIndices: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], accountId: LINKEDIN_ACCOUNTS.said },
        { campaignId: CAMPAIGNS.aiStartups, leadIndices: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50], accountId: LINKEDIN_ACCOUNTS.oskar },
    ];

    let campaignLeadCount = 0;
    for (const assignment of campaignLeadAssignments) {
        for (let i = 0; i < assignment.leadIndices.length; i++) {
            const status = campaignLeadStatuses[i % campaignLeadStatuses.length];
            await prisma.campaignLead.create({
                data: {
                    campaignId: assignment.campaignId,
                    leadId: leadId(assignment.leadIndices[i]),
                    linkedinAccountId: assignment.accountId,
                    status,
                    currentSequenceStep: Math.min(i, 4),
                    nextActionAt: status === "pending" || status === "connection_sent"
                        ? hoursAgo(-randomBetween(1, 48))
                        : null,
                },
            });
            campaignLeadCount++;
        }
    }
    console.log(`✅ Campaign-Leads: ${campaignLeadCount}`);

    // 8. Sequences
    const sequenceTemplates = [
        {
            campaignId: CAMPAIGNS.agencyOutreach,
            steps: [
                { stepOrder: 1, actionType: "view_profile", messageTemplate: null, waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 2, actionType: "wait", messageTemplate: null, waitDays: 1, conditionType: null, conditionValue: null },
                { stepOrder: 3, actionType: "connect", messageTemplate: "Hi {{firstName}}, I noticed we're both in the agency space. Would love to connect and exchange insights on scaling operations. — Said", waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 4, actionType: "wait", messageTemplate: null, waitDays: 3, conditionType: null, conditionValue: null },
                { stepOrder: 5, actionType: "message", messageTemplate: "Thanks for connecting, {{firstName}}! I'm building something that helps agencies automate their LinkedIn outreach. Would you be open to a quick 15-min chat?", waitDays: 0, conditionType: "if_connected", conditionValue: null },
                { stepOrder: 6, actionType: "wait", messageTemplate: null, waitDays: 2, conditionType: null, conditionValue: null },
                { stepOrder: 7, actionType: "follow_up", messageTemplate: "Hey {{firstName}} — just wanted to circle back. No pressure at all, but if you're curious about what we're building at Velaris, happy to share a quick demo link.", waitDays: 0, conditionType: "if_not_replied", conditionValue: null },
            ],
        },
        {
            campaignId: CAMPAIGNS.saasFounders,
            steps: [
                { stepOrder: 1, actionType: "view_profile", messageTemplate: null, waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 2, actionType: "like_post", messageTemplate: null, waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 3, actionType: "wait", messageTemplate: null, waitDays: 1, conditionType: null, conditionValue: null },
                { stepOrder: 4, actionType: "connect", messageTemplate: "Hi {{firstName}} — love what you're building at {{company}}. Fellow SaaS founder here — would be great to connect!", waitDays: 0, conditionType: "if_icp_above", conditionValue: "70" },
                { stepOrder: 5, actionType: "wait", messageTemplate: null, waitDays: 2, conditionType: null, conditionValue: null },
                { stepOrder: 6, actionType: "message", messageTemplate: "Hey {{firstName}}, thanks for accepting! Quick question — how are you handling LinkedIn outreach for {{company}}? We've been testing something new and the reply rates are wild.", waitDays: 0, conditionType: "if_connected", conditionValue: null },
            ],
        },
        {
            campaignId: CAMPAIGNS.nordicCeos,
            steps: [
                { stepOrder: 1, actionType: "view_profile", messageTemplate: null, waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 2, actionType: "wait", messageTemplate: null, waitDays: 1, conditionType: null, conditionValue: null },
                { stepOrder: 3, actionType: "connect", messageTemplate: "{{firstName}}, impressed by {{company}}'s growth. As a fellow Nordic founder, I'd love to connect and share notes on scaling B2B.", waitDays: 0, conditionType: "always", conditionValue: null },
                { stepOrder: 4, actionType: "wait", messageTemplate: null, waitDays: 3, conditionType: null, conditionValue: null },
                { stepOrder: 5, actionType: "message", messageTemplate: "Thanks for connecting {{firstName}}! I'm curious — are you using any LinkedIn automation tools for outreach at {{company}}?", waitDays: 0, conditionType: "if_connected", conditionValue: null },
                { stepOrder: 6, actionType: "wait", messageTemplate: null, waitDays: 3, conditionType: null, conditionValue: null },
                { stepOrder: 7, actionType: "follow_up", messageTemplate: "Hi {{firstName}} — one last note. We have a few spots open for our beta cohort. If you'd like early access, just say the word!", waitDays: 0, conditionType: "if_not_replied", conditionValue: null },
            ],
        },
    ];

    let sequenceCount = 0;
    for (const template of sequenceTemplates) {
        for (const step of template.steps) {
            await prisma.sequence.create({
                data: { campaignId: template.campaignId, ...step },
            });
            sequenceCount++;
        }
    }
    console.log(`✅ Sequences: ${sequenceCount} steps across 3 campaigns`);

    // 9. Messages — realistic Unibox conversations
    const conversations = [
        {
            leadIndex: 1, accountId: LINKEDIN_ACCOUNTS.said, campaignId: CAMPAIGNS.agencyOutreach,
            messages: [
                { direction: "sent", content: "Hi Marcus, I noticed we're both in the agency space. Would love to connect and exchange insights on scaling operations. — Said", hoursAgo: 120 },
                { direction: "received", content: "Hey Said! Thanks for reaching out. Always happy to connect with fellow agency people. What are you working on?", hoursAgo: 96 },
                { direction: "sent", content: "Thanks for connecting, Marcus! I'm building Velaris — an AI-powered LinkedIn outreach platform. We help agencies like Nordhaven automate prospecting while keeping it personal. Would you be open to a quick 15-min demo?", hoursAgo: 72 },
                { direction: "received", content: "Sounds interesting! We've been looking for something like this. Can you send over a Calendly link? Happy to take a look.", hoursAgo: 48 },
                { direction: "sent", content: "Amazing! Here's my calendar: calendly.com/saidborna/demo — Pick any time that works. Looking forward to showing you what we've built!", hoursAgo: 24 },
            ],
        },
        {
            leadIndex: 4, accountId: LINKEDIN_ACCOUNTS.said, campaignId: CAMPAIGNS.agencyOutreach,
            messages: [
                { direction: "sent", content: "Hi Anna — love what you're building at FintechFlow. Fellow Nordic founder here, would be great to connect!", hoursAgo: 168 },
                { direction: "received", content: "Hi Said! Thanks, FintechFlow is definitely keeping us busy. Happy to connect!", hoursAgo: 144 },
                { direction: "sent", content: "Awesome! Quick question — how are you handling outbound at FintechFlow? We've been testing something new with AI-powered outreach and the results are pretty wild.", hoursAgo: 120 },
                { direction: "received", content: "We're mostly doing cold email right now but the reply rates have been dropping. Would love to hear more about what you're doing on LinkedIn.", hoursAgo: 96 },
                { direction: "sent", content: "Totally get it — email is getting tougher. LinkedIn has been amazing for us. We're seeing 24% reply rates and 52% connection acceptance. Happy to show you the setup.", hoursAgo: 72 },
                { direction: "received", content: "That's impressive! Yes let's set up a call. How does next Tuesday look for you?", hoursAgo: 36 },
            ],
        },
        {
            leadIndex: 5, accountId: LINKEDIN_ACCOUNTS.said, campaignId: CAMPAIGNS.nordicCeos,
            messages: [
                { direction: "sent", content: "Jonas, impressed by Nordic Ventures' portfolio. As a fellow Nordic founder, I'd love to connect and share notes on scaling B2B.", hoursAgo: 72 },
                { direction: "received", content: "Said — thanks for the kind words. Always looking to connect with builders. What are you working on?", hoursAgo: 48 },
                { direction: "sent", content: "Building Velaris — AI-powered LinkedIn outreach + content platform. Think of it as an all-in-one for B2B sales teams. We're in early growth stage and the traction has been incredible.", hoursAgo: 24 },
                { direction: "received", content: "Interesting space. We've been tracking the LinkedIn automation market. Seems like it's heating up. What's your differentiation?", hoursAgo: 8 },
            ],
        },
        {
            leadIndex: 10, accountId: LINKEDIN_ACCOUNTS.elliot, campaignId: CAMPAIGNS.saasFounders,
            messages: [
                { direction: "sent", content: "Hi Isabella — love what GrowthOS is doing in the SaaS space. Would be great to connect as fellow Stockholm folks!", hoursAgo: 48 },
                { direction: "received", content: "Hey! Thanks for reaching out. Always happy to connect with Stockholm SaaS people. What do you do?", hoursAgo: 24 },
                { direction: "sent", content: "We're building Velaris — an AI outreach platform for LinkedIn. Think automated intelligent sequences + AI content generation. Happy to tell you more over a coffee?", hoursAgo: 12 },
            ],
        },
        {
            leadIndex: 15, accountId: LINKEDIN_ACCOUNTS.oskar, campaignId: CAMPAIGNS.aiStartups,
            messages: [
                { direction: "sent", content: "Hugo, your work on PipelineAI looks fascinating. Fellow AI builder here — would love to exchange notes.", hoursAgo: 96 },
                { direction: "received", content: "Hey! Thanks, PipelineAI has been a wild ride. What are you building?", hoursAgo: 72 },
                { direction: "sent", content: "Velaris — AI-powered LinkedIn outreach. We use Claude for personalization and ICP scoring. Our sequence builder is node-based, visual, and bug-free (unlike the competition). Would love to compare notes on AI infra!", hoursAgo: 48 },
                { direction: "received", content: "Fair point about the competitors. I've tried a few and the builders are always buggy. Would love to see yours. Can you share a link?", hoursAgo: 24 },
                { direction: "sent", content: "Absolutely! Here's our live app: velaris.app — create a free account and I'll jump on a quick call to walk you through. Best time for you?", hoursAgo: 6 },
            ],
        },
        {
            leadIndex: 24, accountId: LINKEDIN_ACCOUNTS.said, campaignId: CAMPAIGNS.agencyOutreach,
            messages: [
                { direction: "sent", content: "Hi Ebba — AI Nordic Labs caught my eye. Incredible work in the AI space! Would love to connect.", hoursAgo: 36 },
                { direction: "received", content: "Thanks Said! Always exciting to meet fellow AI enthusiasts. Connected! What's your angle?", hoursAgo: 18 },
            ],
        },
        {
            leadIndex: 29, accountId: LINKEDIN_ACCOUNTS.elliot, campaignId: CAMPAIGNS.saasFounders,
            messages: [
                { direction: "sent", content: "Leo, FinanceFlow is doing impressive things in the fintech space. Would love to connect!", hoursAgo: 240 },
                { direction: "received", content: "Thanks! Happy to connect. Are you in fintech too?", hoursAgo: 216 },
                { direction: "sent", content: "Not fintech directly — I'm building an AI-powered LinkedIn outreach tool called Velaris. Helps SaaS companies like FinanceFlow scale outbound.", hoursAgo: 192 },
                { direction: "received", content: "We've been discussing exactly this. Our SDRs spend too much time on manual LinkedIn work. Can you walk me through your solution?", hoursAgo: 168 },
                { direction: "sent", content: "Absolutely! Let me send you access to our platform. You can play around with it and then we can do a proper walkthrough.", hoursAgo: 144 },
                { direction: "received", content: "Perfect. Send it over!", hoursAgo: 120 },
                { direction: "sent", content: "Done! Check your email — I sent an invite. You'll see the campaign builder, AI content generator, and our ICP scoring right away. Let me know when you're ready for the walkthrough!", hoursAgo: 96 },
            ],
        },
    ];

    let messageCount = 0;
    for (const convo of conversations) {
        for (const msg of convo.messages) {
            await prisma.message.create({
                data: {
                    workspaceId: actualWorkspaceId,
                    linkedinAccountId: convo.accountId,
                    leadId: leadId(convo.leadIndex),
                    campaignId: convo.campaignId,
                    direction: msg.direction,
                    content: msg.content,
                    messageType: "text",
                    read: msg.hoursAgo > 12,
                    starred: msg.direction === "received" && msg.content.toLowerCase().includes("calendar"),
                    sentAt: hoursAgo(msg.hoursAgo),
                },
            });
            messageCount++;
        }
    }
    console.log(`✅ Messages: ${messageCount} across ${conversations.length} conversations`);

    // 10. Content Posts
    const contentPostData = [
        {
            category: "Thought Leadership",
            topic: "The Future of B2B Outreach",
            targetAudience: "SaaS Founders, Sales Leaders",
            tone: "professional",
            generatedContent: "The Cold Email is Dead. Long Live Intelligent Outreach.\n\nI've been running LinkedIn outreach campaigns for the past 6 months and here's what I've learned:\n\n- Personalization beats volume every single time\n- AI-scored leads convert 3x better than random lists\n- The best sequences feel like genuine conversations\n\nWe went from 5% reply rates to 24% by doing three things:\n\n1. ICP scoring every lead before reaching out\n2. Warming up with profile views + likes\n3. Writing messages that reference specific content\n\nThe result? 90 booked calls in 30 days. On autopilot.\n\nWhat's working for your outreach right now?\n\n#B2B #SaaS #LinkedInOutreach #SalesAutomation",
            status: "posted",
            scheduledAt: daysAgo(3),
            linkedinAccountId: LINKEDIN_ACCOUNTS.said,
            postedAt: daysAgo(3),
            createdAt: daysAgo(4),
        },
        {
            category: "Product Update",
            topic: "Introducing AI-Powered ICP Scoring",
            targetAudience: "Sales Teams, Growth Hackers",
            tone: "exciting",
            generatedContent: "We just shipped something big at Velaris.\n\nAI-Powered ICP Scoring is now live.\n\nHere's how it works:\n- Describe your ideal customer in plain text\n- Set your minimum match score (we recommend 70+)\n- AI analyzes each lead's profile, company, and activity\n- Only qualified leads enter your outreach sequence\n\nEarly results from beta users:\n- 42% higher reply rates\n- 3x more qualified conversations\n- 67% less time wasted on bad-fit leads\n\nNo more guessing. No more spreadsheet scoring.\n\nWant early access? Comment 'ICP' below.\n\n#AI #SalesTech #ICP #LeadScoring #Velaris",
            status: "posted",
            scheduledAt: daysAgo(7),
            linkedinAccountId: LINKEDIN_ACCOUNTS.said,
            postedAt: daysAgo(7),
            createdAt: daysAgo(8),
        },
        {
            category: "Case Study",
            topic: "How We Booked 90 Calls in 30 Days",
            targetAudience: "Agency Owners, Consultants",
            tone: "storytelling",
            generatedContent: "90 calls booked in 30 days.\n\nHere's the exact playbook we used:\n\nStep 1: Built a lead list of 500 Nordic SaaS founders\nStep 2: Scored them with AI — filtered to top 200 (ICP 70+)\nStep 3: Created a 7-step sequence:\n  Day 0: View profile\n  Day 1: Like their latest post\n  Day 2: Send connection request (personalized note)\n  Day 5: First message (value-focused)\n  Day 8: Follow-up with social proof\n  Day 12: Final touch with case study link\n  Day 15: Close or nurture\n\nResults:\n- 52% connection acceptance\n- 24% reply rate\n- 142 showed genuine interest\n- 90 booked calls\n- $86K pipeline generated\n\nThe secret? We didn't try to sell. We started conversations.\n\n#Outreach #LinkedInStrategy #B2BLeadGen",
            status: "scheduled",
            scheduledAt: hoursAgo(-48),
            linkedinAccountId: LINKEDIN_ACCOUNTS.said,
            postedAt: null,
            createdAt: daysAgo(1),
        },
        {
            category: "Tips & Tricks",
            topic: "5 LinkedIn Mistakes Killing Your Reply Rates",
            targetAudience: "SDRs, Sales Reps, Founders",
            tone: "direct",
            generatedContent: "5 LinkedIn mistakes killing your reply rates:\n\n1. Sending the same template to everyone\n2. Leading with your product pitch\n3. Not viewing profiles before connecting\n4. Following up too aggressively (or not at all)\n5. Ignoring ICP fit — spraying and praying\n\nWhat top performers do instead:\n\n- Research the lead's recent activity\n- Reference something specific in their profile\n- Start with curiosity, not a pitch\n- Wait 2-3 days between touchpoints\n- Score leads BEFORE adding to sequences\n\nSmall changes. Massive impact.\n\n#LinkedInTips #SalesHacks #ColdOutreach",
            status: "draft",
            scheduledAt: null,
            linkedinAccountId: null,
            postedAt: null,
            createdAt: hoursAgo(6),
        },
        {
            category: "Industry Analysis",
            topic: "The Rise of AI in Sales Automation",
            targetAudience: "VPs of Sales, Revenue Leaders",
            tone: "analytical",
            generatedContent: "The sales automation landscape is shifting fast.\n\nHere's what the data tells us about AI in outbound:\n\n- Companies using AI-scored leads see 34% higher conversion rates\n- Personalized sequences outperform templates by 2.8x\n- Multi-touch campaigns (5+ touchpoints) generate 60% more pipeline\n- LinkedIn outreach reply rates are 3x higher than cold email\n\nBut here's the thing most people miss:\n\nAI doesn't replace the human touch. It amplifies it.\n\nThe best outreach combines:\n- AI for research, scoring, and timing\n- Human judgment for messaging and relationship building\n- Automation for scale and consistency\n\nThe future of sales isn't AI OR human. It's AI AND human.\n\n#SalesAutomation #AI #FutureOfSales #B2B",
            status: "draft",
            scheduledAt: null,
            linkedinAccountId: null,
            postedAt: null,
            createdAt: hoursAgo(2),
        },
    ];

    for (const post of contentPostData) {
        await prisma.contentPost.create({
            data: { workspaceId: actualWorkspaceId, ...post },
        });
    }
    console.log(`✅ Content Posts: ${contentPostData.length}`);

    // 11. Inbound Automations
    const inboundAutomationData = [
        {
            name: "ICP Launch Post — Auto DM",
            postUrl: "https://linkedin.com/posts/saidborna_icp-scoring-launch",
            triggerKeywords: ["ICP", "interested", "access", "want", "try"],
            autoReplyComment: "Thanks for your interest! Check your DMs",
            autoDmMessage: "Hey {{firstName}}! Thanks for commenting on my ICP scoring post. Here's your early access link: velaris.app/signup",
            status: "active",
            triggersCount: 127,
        },
        {
            name: "Outreach Playbook Post",
            postUrl: "https://linkedin.com/posts/saidborna_90-calls-playbook",
            triggerKeywords: ["playbook", "template", "sequence", "share", "send"],
            autoReplyComment: "Just sent it to your DMs!",
            autoDmMessage: "Hi {{firstName}}! As promised, here's the full 7-step outreach playbook: velaris.app/playbook",
            status: "active",
            triggersCount: 89,
        },
        {
            name: "Product Demo Requests",
            postUrl: "https://linkedin.com/posts/saidborna_velaris-demo",
            triggerKeywords: ["demo", "show me", "walk through", "interested"],
            autoReplyComment: "Absolutely! Sending you a DM now",
            autoDmMessage: "Hey {{firstName}}! Would love to show you Velaris in action. Here's my calendar: calendly.com/saidborna/demo",
            status: "paused",
            triggersCount: 42,
        },
    ];

    for (const automation of inboundAutomationData) {
        const created = await prisma.inboundAutomation.create({
            data: {
                workspaceId: actualWorkspaceId,
                ...automation,
                createdAt: daysAgo(randomBetween(10, 30)),
            },
        });

        // Link to Said's LinkedIn account
        await prisma.$executeRawUnsafe(
            `INSERT INTO inbound_automation_accounts (automation_id, linkedin_account_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT DO NOTHING`,
            created.id,
            LINKEDIN_ACCOUNTS.said,
        );
    }
    console.log(`✅ Inbound Automations: ${inboundAutomationData.length}`);

    // 12. Activity Log — last 30 days for dashboard chart
    const activityActions = [
        "connection_sent", "connection_accepted", "message_sent",
        "reply_received", "profile_viewed", "post_liked", "opportunity_created",
    ];

    let activityCount = 0;
    const accountIds = [LINKEDIN_ACCOUNTS.said, LINKEDIN_ACCOUNTS.elliot, LINKEDIN_ACCOUNTS.oskar];
    const campaignIds = [
        CAMPAIGNS.agencyOutreach, CAMPAIGNS.saasFounders,
        CAMPAIGNS.recruiters, CAMPAIGNS.nordicCeos, CAMPAIGNS.aiStartups,
    ];

    for (let day = 0; day < 30; day++) {
        const dailyVolume = day < 7 ? randomBetween(15, 30) : randomBetween(8, 20);

        for (let j = 0; j < dailyVolume; j++) {
            await prisma.activityLog.create({
                data: {
                    workspaceId: actualWorkspaceId,
                    action: activityActions[randomBetween(0, activityActions.length - 1)],
                    linkedinAccountId: accountIds[randomBetween(0, accountIds.length - 1)],
                    campaignId: campaignIds[randomBetween(0, campaignIds.length - 1)],
                    leadId: leadId(randomBetween(1, 50)),
                    metadata: { automated: true },
                    createdAt: daysAgo(day),
                },
            });
            activityCount++;
        }
    }
    console.log(`✅ Activity Log: ${activityCount} entries (30 days)`);

    // 13. ICP Config
    await prisma.icpConfig.create({
        data: {
            workspaceId: actualWorkspaceId,
            criteria: {
                description: "Europe-based SaaS founder/CEO with 2-50 employees, Series A or bootstrapped, in B2B software or marketing tech",
                minScore: 70,
                weights: {
                    title: 0.25,
                    companySize: 0.2,
                    industry: 0.2,
                    location: 0.15,
                    experience: 0.1,
                    engagement: 0.1,
                },
            },
        },
    });
    console.log("✅ ICP Config: 1 profile");

    console.log("\n🎉 Seed complete! Demo data is ready.");
    console.log(`   Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}

// ─── Execute ────────────────────────────────────────────

main()
    .catch((error: unknown) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
