// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { CampaignLead, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface CampaignLeadListParams {
  page: number;
  pageSize: number;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CampaignLeadWithLead extends CampaignLead {
  lead: {
    id: string;
    fullName: string | null;
    title: string | null;
    company: string | null;
    email: string | null;
    linkedinUrl: string | null;
    icpScore: number | null;
    avatarUrl: string | null;
  };
}

// ── Queries ──────────────────────────────────────────────

/**
 * List leads assigned to a campaign with pagination.
 */
export async function listCampaignLeads(
  workspaceId: string,
  campaignId: string,
  params: CampaignLeadListParams
): Promise<PaginatedResult<CampaignLeadWithLead>> {
  const { page, pageSize, status } = params;

  const where: Prisma.CampaignLeadWhereInput = {
    campaignId,
    campaign: { workspaceId },
    ...(status ? { status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.campaignLead.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            title: true,
            company: true,
            email: true,
            linkedinUrl: true,
            icpScore: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.campaignLead.count({ where }),
  ]);

  return {
    data: data as CampaignLeadWithLead[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Assign leads to a campaign.
 */
export async function assignLeadsToCampaign(
  workspaceId: string,
  campaignId: string,
  leadIds: string[],
  linkedinAccountId?: string
): Promise<{ count: number }> {
  // Verify campaign belongs to workspace
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify all leads belong to workspace
  const validLeads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, workspaceId },
    select: { id: true },
  });

  const validIds = validLeads.map((l) => l.id);

  const result = await prisma.campaignLead.createMany({
    data: validIds.map((leadId) => ({
      campaignId,
      leadId,
      linkedinAccountId: linkedinAccountId ?? null,
      status: "pending",
    })),
    skipDuplicates: true,
  });

  // Update campaign totalLeads
  const totalLeads = await prisma.campaignLead.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalLeads },
  });

  return { count: result.count };
}

/**
 * Update a campaign lead's status.
 */
export async function updateCampaignLeadStatus(
  workspaceId: string,
  campaignLeadId: string,
  status: string
): Promise<CampaignLead> {
  // Ensure the campaign_lead belongs to the workspace via campaign
  const existing = await prisma.campaignLead.findFirst({
    where: {
      id: campaignLeadId,
      campaign: { workspaceId },
    },
  });

  if (!existing) {
    throw new Error("Campaign lead not found");
  }

  return prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: { status },
  });
}

/**
 * Get next scheduled actions for BullMQ worker processing.
 */
export async function getNextScheduledActions(
  workspaceId: string,
  limit: number = 50
): Promise<CampaignLeadWithLead[]> {
  const now = new Date();

  const items = await prisma.campaignLead.findMany({
    where: {
      campaign: { workspaceId, status: "active" },
      nextActionAt: { lte: now },
      status: { notIn: ["replied", "opportunity", "not_interested", "error"] },
    },
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          title: true,
          company: true,
          email: true,
          linkedinUrl: true,
          icpScore: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { nextActionAt: "asc" },
    take: limit,
  });

  return items as CampaignLeadWithLead[];
}
