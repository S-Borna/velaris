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

/** Campaign with computed stats from relations. */
export type CampaignWithStats = Prisma.CampaignGetPayload<{
  include: {
    campaignAccounts: { include: { linkedinAccount: true } };
    _count: { select: { campaignLeads: true; sequences: true } };
  };
}>;

/** Filters for campaign list queries. */
export interface CampaignFilters {
  status?: string;
  search?: string;
}

/** Input for creating a campaign. */
export interface CreateCampaignInput {
  name: string;
  scheduleTimezone?: string;
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  scheduleDays?: string[];
}

/** Input for updating a campaign. */
export interface UpdateCampaignInput {
  name?: string;
  scheduleTimezone?: string;
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  scheduleDays?: string[];
}

// ─── Queries ────────────────────────────────────────────

/**
 * List campaigns for a workspace with optional filters and pagination.
 */
export async function listCampaigns(
  workspaceId: string,
  filters: CampaignFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<CampaignWithStats>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const where: Prisma.CampaignWhereInput = {
    workspaceId,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        campaignAccounts: { include: { linkedinAccount: true } },
        _count: { select: { campaignLeads: true, sequences: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.campaign.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Get a single campaign by ID, scoped to workspace.
 */
export async function getCampaignById(
  workspaceId: string,
  campaignId: string,
): Promise<CampaignWithStats | null> {
  return prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: {
      campaignAccounts: { include: { linkedinAccount: true } },
      _count: { select: { campaignLeads: true, sequences: true } },
    },
  });
}

/**
 * Create a new campaign in a workspace.
 */
export async function createCampaign(
  workspaceId: string,
  input: CreateCampaignInput,
): Promise<CampaignWithStats> {
  return prisma.campaign.create({
    data: {
      workspaceId,
      name: input.name,
      scheduleTimezone: input.scheduleTimezone ?? "Europe/Stockholm",
      scheduleStartHour: input.scheduleStartHour ?? 9,
      scheduleEndHour: input.scheduleEndHour ?? 17,
      scheduleDays: input.scheduleDays ?? ["mon", "tue", "wed", "thu", "fri"],
    },
    include: {
      campaignAccounts: { include: { linkedinAccount: true } },
      _count: { select: { campaignLeads: true, sequences: true } },
    },
  });
}

/**
 * Update a campaign. Fields not provided are left unchanged.
 */
export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<CampaignWithStats | null> {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!existing) return null;

  return prisma.campaign.update({
    where: { id: campaignId },
    data: input,
    include: {
      campaignAccounts: { include: { linkedinAccount: true } },
      _count: { select: { campaignLeads: true, sequences: true } },
    },
  });
}

/**
 * Update campaign status (draft → active → paused → completed).
 */
export async function updateCampaignStatus(
  workspaceId: string,
  campaignId: string,
  status: string,
): Promise<CampaignWithStats | null> {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!existing) return null;

  return prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
    include: {
      campaignAccounts: { include: { linkedinAccount: true } },
      _count: { select: { campaignLeads: true, sequences: true } },
    },
  });
}

/**
 * Delete a campaign and all related data (cascades).
 */
export async function deleteCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<boolean> {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!existing) return false;

  await prisma.campaign.delete({ where: { id: campaignId } });
  return true;
}

/**
 * Duplicate a campaign with its sequences.
 */
export async function duplicateCampaign(
  workspaceId: string,
  campaignId: string,
): Promise<CampaignWithStats | null> {
  const original = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: { sequences: true, campaignAccounts: true },
  });

  if (!original) return null;

  return prisma.campaign.create({
    data: {
      workspaceId,
      name: `${original.name} (Copy)`,
      scheduleTimezone: original.scheduleTimezone,
      scheduleStartHour: original.scheduleStartHour,
      scheduleEndHour: original.scheduleEndHour,
      scheduleDays: original.scheduleDays,
      sequences: {
        create: original.sequences.map((seq) => ({
          stepOrder: seq.stepOrder,
          actionType: seq.actionType,
          messageTemplate: seq.messageTemplate,
          waitDays: seq.waitDays,
          conditionType: seq.conditionType,
          conditionValue: seq.conditionValue,
        })),
      },
      campaignAccounts: {
        create: original.campaignAccounts.map((ca) => ({
          linkedinAccountId: ca.linkedinAccountId,
        })),
      },
    },
    include: {
      campaignAccounts: { include: { linkedinAccount: true } },
      _count: { select: { campaignLeads: true, sequences: true } },
    },
  });
}

/**
 * Get aggregated stats for a campaign.
 */
export async function getCampaignStats(
  workspaceId: string,
  campaignId: string,
): Promise<{
  totalLeads: number;
  connectionsSent: number;
  connectionsAccepted: number;
  messagesSent: number;
  repliesReceived: number;
  opportunities: number;
} | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    select: {
      totalLeads: true,
      connectionsSent: true,
      connectionsAccepted: true,
      messagesSent: true,
      repliesReceived: true,
      opportunitiesValue: true,
    },
  });

  if (!campaign) return null;

  return {
    totalLeads: campaign.totalLeads,
    connectionsSent: campaign.connectionsSent,
    connectionsAccepted: campaign.connectionsAccepted,
    messagesSent: campaign.messagesSent,
    repliesReceived: campaign.repliesReceived,
    opportunities: Number(campaign.opportunitiesValue),
  };
}

/**
 * Link LinkedIn accounts to a campaign.
 */
export async function setCampaignAccounts(
  workspaceId: string,
  campaignId: string,
  linkedinAccountIds: string[],
): Promise<void> {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!existing) {
    throw new Error("Campaign not found");
  }

  await prisma.$transaction([
    prisma.campaignAccount.deleteMany({ where: { campaignId } }),
    ...linkedinAccountIds.map((linkedinAccountId) =>
      prisma.campaignAccount.create({
        data: { campaignId, linkedinAccountId },
      }),
    ),
  ]);
}
