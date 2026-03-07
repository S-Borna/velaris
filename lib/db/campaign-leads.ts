// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import {
  type PaginatedResult,
  type PaginationParams,
  getPaginationValues,
  buildPaginatedResult,
} from "@/lib/db/types";

// ─── Types ──────────────────────────────────────────────

/** CampaignLead with related lead and account info. */
export type CampaignLeadWithRelations = Prisma.CampaignLeadGetPayload<{
  include: {
    lead: true;
    linkedinAccount: true;
  };
}>;

/** Filters for campaign lead queries. */
export interface CampaignLeadFilters {
  status?: string;
  search?: string;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List leads assigned to a campaign with pagination.
 */
export async function listCampaignLeads(
  campaignId: string,
  filters: CampaignLeadFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<CampaignLeadWithRelations>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const where: Prisma.CampaignLeadWhereInput = {
    campaignId,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      lead: {
        OR: [
          { fullName: { contains: filters.search, mode: "insensitive" as const } },
          { company: { contains: filters.search, mode: "insensitive" as const } },
          { title: { contains: filters.search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.campaignLead.findMany({
      where,
      include: { lead: true, linkedinAccount: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.campaignLead.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Assign leads to a campaign. Skips leads already assigned.
 */
export async function assignLeadsToCampaign(
  campaignId: string,
  leadIds: string[],
  linkedinAccountId?: string,
): Promise<number> {
  const existing = await prisma.campaignLead.findMany({
    where: { campaignId, leadId: { in: leadIds } },
    select: { leadId: true },
  });

  const existingIds = new Set(existing.map((cl) => cl.leadId));
  const newLeadIds = leadIds.filter((id) => !existingIds.has(id));

  if (newLeadIds.length === 0) return 0;

  const result = await prisma.campaignLead.createMany({
    data: newLeadIds.map((leadId) => ({
      campaignId,
      leadId,
      linkedinAccountId: linkedinAccountId ?? null,
    })),
  });

  // Update campaign total_leads count
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalLeads: {
        increment: result.count,
      },
    },
  });

  return result.count;
}

/**
 * Remove a lead from a campaign.
 */
export async function removeLeadFromCampaign(
  campaignLeadId: string,
): Promise<boolean> {
  const existing = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
  });

  if (!existing) return false;

  await prisma.campaignLead.delete({ where: { id: campaignLeadId } });

  await prisma.campaign.update({
    where: { id: existing.campaignId },
    data: { totalLeads: { decrement: 1 } },
  });

  return true;
}

/**
 * Update the status of a campaign lead.
 */
export async function updateCampaignLeadStatus(
  campaignLeadId: string,
  status: string,
  nextActionAt?: Date,
): Promise<CampaignLeadWithRelations | null> {
  const existing = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
  });

  if (!existing) return null;

  return prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: { status, nextActionAt: nextActionAt ?? null },
    include: { lead: true, linkedinAccount: true },
  });
}

/**
 * Get campaign leads that need their next action processed.
 */
export async function getLeadsReadyForAction(
  campaignId: string,
  beforeTime?: Date,
): Promise<CampaignLeadWithRelations[]> {
  return prisma.campaignLead.findMany({
    where: {
      campaignId,
      nextActionAt: {
        lte: beforeTime ?? new Date(),
      },
      status: { notIn: ["not_interested", "error", "opportunity"] },
    },
    include: { lead: true, linkedinAccount: true },
    orderBy: { nextActionAt: "asc" },
  });
}

/**
 * Get status distribution for a campaign (for funnel visualizations).
 */
export async function getCampaignLeadStatusCounts(
  campaignId: string,
): Promise<Record<string, number>> {
  const results = await prisma.campaignLead.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { status: true },
  });

  return Object.fromEntries(
    results.map((r) => [r.status, r._count.status]),
  );
}
