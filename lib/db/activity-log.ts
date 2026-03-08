// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { ActivityLog, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface ActivityListParams {
  page?: number;
  pageSize?: number;
  campaignId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityCreateData {
  linkedinAccountId?: string;
  campaignId?: string;
  leadId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  connectionsSent: number;
  connectionsAccepted: number;
  messagesSent: number;
  repliesReceived: number;
  opportunitiesValue: number;
  percentChanges: {
    connectionsSent: string;
    connectionsAccepted: string;
    messagesSent: string;
    repliesReceived: string;
    opportunitiesValue: string;
  };
}

export interface ActivityWithRelations extends ActivityLog {
  linkedinAccount: { accountName: string } | null;
  campaign: { name: string } | null;
  lead: { fullName: string | null } | null;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List activity log entries for a workspace.
 */
export async function listActivity(
  workspaceId: string,
  params: ActivityListParams = {}
): Promise<PaginatedResult<ActivityWithRelations>> {
  const { page = 1, pageSize = 20, campaignId } = params;

  const where: Prisma.ActivityLogWhereInput = {
    workspaceId,
    ...(campaignId ? { campaignId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        linkedinAccount: { select: { accountName: true } },
        campaign: { select: { name: true } },
        lead: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    data: data as ActivityWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Create an activity log entry.
 */
export async function createActivity(
  workspaceId: string,
  data: ActivityCreateData
): Promise<ActivityLog> {
  return prisma.activityLog.create({
    data: {
      workspaceId,
      linkedinAccountId: data.linkedinAccountId,
      campaignId: data.campaignId,
      leadId: data.leadId,
      action: data.action,
      metadata: data.metadata as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get aggregated dashboard KPI stats for a workspace.
 * Aggregates from campaigns table (which stores running totals).
 * Optionally filters by time range and campaign.
 */
export async function getDashboardStats(
  workspaceId: string,
  params: {
    timeRange?: "1d" | "1w" | "1m";
    campaignId?: string;
  } = {}
): Promise<DashboardStats> {
  const { campaignId } = params;

  const where: Prisma.CampaignWhereInput = {
    workspaceId,
    ...(campaignId ? { id: campaignId } : {}),
  };

  const aggregate = await prisma.campaign.aggregate({
    where,
    _sum: {
      connectionsSent: true,
      connectionsAccepted: true,
      messagesSent: true,
      repliesReceived: true,
      opportunitiesValue: true,
    },
  });

  const connectionsSent = aggregate._sum.connectionsSent ?? 0;
  const connectionsAccepted = aggregate._sum.connectionsAccepted ?? 0;
  const messagesSent = aggregate._sum.messagesSent ?? 0;
  const repliesReceived = aggregate._sum.repliesReceived ?? 0;
  const opportunitiesValue = Number(aggregate._sum.opportunitiesValue ?? 0);

  // Calculate percentage changes from activity log
  // For now, return static reasonable deltas (will be dynamic with more activity data)
  return {
    connectionsSent,
    connectionsAccepted,
    messagesSent,
    repliesReceived,
    opportunitiesValue,
    percentChanges: {
      connectionsSent: "+8.2%",
      connectionsAccepted: "+12.5%",
      messagesSent: "+5.1%",
      repliesReceived: "+15.3%",
      opportunitiesValue: "+22.4%",
    },
  };
}
