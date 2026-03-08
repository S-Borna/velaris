// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { Campaign, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface CampaignListParams {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CampaignCreateData {
  name: string;
  status?: string;
  scheduleTimezone?: string;
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  scheduleDays?: string[];
}

export interface CampaignUpdateData {
  name?: string;
  status?: string;
  totalLeads?: number;
  connectionsSent?: number;
  connectionsAccepted?: number;
  messagesSent?: number;
  repliesReceived?: number;
  opportunitiesValue?: number;
  scheduleTimezone?: string;
  scheduleStartHour?: number;
  scheduleEndHour?: number;
  scheduleDays?: string[];
}

// ── Queries ──────────────────────────────────────────────

/**
 * List campaigns for a workspace with pagination, filtering, sorting.
 */
export async function listCampaigns(
  workspaceId: string,
  params: CampaignListParams
): Promise<PaginatedResult<Campaign>> {
  const { page, pageSize, status, search, sort, order } = params;

  const where: Prisma.CampaignWhereInput = {
    workspaceId,
    ...(status && status !== "all" ? { status } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const orderBy: Prisma.CampaignOrderByWithRelationInput = sort
    ? { [sort]: order ?? "desc" }
    : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy,
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single campaign by ID, scoped to workspace.
 */
export async function getCampaignById(
  workspaceId: string,
  campaignId: string
): Promise<Campaign | null> {
  return prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });
}

/**
 * Create a new campaign in a workspace.
 */
export async function createCampaign(
  workspaceId: string,
  data: CampaignCreateData
): Promise<Campaign> {
  return prisma.campaign.create({
    data: {
      workspaceId,
      name: data.name,
      status: data.status ?? "draft",
      scheduleTimezone: data.scheduleTimezone,
      scheduleStartHour: data.scheduleStartHour,
      scheduleEndHour: data.scheduleEndHour,
      scheduleDays: data.scheduleDays,
    },
  });
}

/**
 * Update an existing campaign.
 */
export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  data: CampaignUpdateData
): Promise<Campaign> {
  return prisma.campaign.update({
    where: { id: campaignId, workspaceId },
    data,
  });
}

/**
 * Change campaign status only.
 */
export async function updateCampaignStatus(
  workspaceId: string,
  campaignId: string,
  status: string
): Promise<Campaign> {
  return prisma.campaign.update({
    where: { id: campaignId, workspaceId },
    data: { status },
  });
}

/**
 * Get aggregated stats for a campaign from campaign_leads.
 */
export async function getCampaignStats(
  workspaceId: string,
  campaignId: string
): Promise<{
  totalLeads: number;
  pending: number;
  connectionSent: number;
  connected: number;
  messaged: number;
  replied: number;
  opportunity: number;
}> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    return {
      totalLeads: 0,
      pending: 0,
      connectionSent: 0,
      connected: 0,
      messaged: 0,
      replied: 0,
      opportunity: 0,
    };
  }

  const statuses = await prisma.campaignLead.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { id: true },
  });

  const statusMap: Record<string, number> = {};
  for (const s of statuses) {
    statusMap[s.status] = s._count.id;
  }

  return {
    totalLeads: Object.values(statusMap).reduce((a, b) => a + b, 0),
    pending: statusMap["pending"] ?? 0,
    connectionSent: statusMap["connection_sent"] ?? 0,
    connected: statusMap["connected"] ?? 0,
    messaged: statusMap["messaged"] ?? 0,
    replied: statusMap["replied"] ?? 0,
    opportunity: statusMap["opportunity"] ?? 0,
  };
}

/**
 * Delete a campaign.
 */
export async function deleteCampaign(
  workspaceId: string,
  campaignId: string
): Promise<Campaign> {
  return prisma.campaign.delete({
    where: { id: campaignId, workspaceId },
  });
}
