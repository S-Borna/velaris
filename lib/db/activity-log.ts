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

/** Activity log entry with related entities. */
export type ActivityLogWithRelations = Prisma.ActivityLogGetPayload<{
  include: {
    linkedinAccount: true;
    campaign: true;
    lead: true;
  };
}>;

/** Input for creating an activity log entry. */
export interface CreateActivityLogInput {
  linkedinAccountId?: string;
  campaignId?: string;
  leadId?: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}

/** Dashboard stats aggregated from activity log + other tables. */
export interface DashboardStats {
  connectionsSent: number;
  connectionsAccepted: number;
  messagesSent: number;
  repliesReceived: number;
  opportunitiesValue: number;
}

/** Time-range filter options. */
export type TimeRange = "1d" | "7d" | "30d" | "90d" | "all";

// ─── Helpers ────────────────────────────────────────────

/**
 * Get date threshold for a given time range.
 */
function getDateThreshold(range: TimeRange): Date | null {
  if (range === "all") return null;

  const now = new Date();
  const RANGE_DAYS: Record<string, number> = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const days = RANGE_DAYS[range];
  if (!days) return null;

  now.setDate(now.getDate() - days);
  return now;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List activity logs — paginated, with optional filters.
 */
export async function listActivityLogs(
  workspaceId: string,
  filters: {
    campaignId?: string;
    linkedinAccountId?: string;
    leadId?: string;
    action?: string;
    timeRange?: TimeRange;
  } = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<ActivityLogWithRelations>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const dateThreshold = getDateThreshold(filters.timeRange ?? "all");

  const where: Prisma.ActivityLogWhereInput = {
    workspaceId,
    ...(filters.campaignId && { campaignId: filters.campaignId }),
    ...(filters.linkedinAccountId && {
      linkedinAccountId: filters.linkedinAccountId,
    }),
    ...(filters.leadId && { leadId: filters.leadId }),
    ...(filters.action && { action: filters.action }),
    ...(dateThreshold && { createdAt: { gte: dateThreshold } }),
  };

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { linkedinAccount: true, campaign: true, lead: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Create a new activity log entry.
 */
export async function createActivityLog(
  workspaceId: string,
  input: CreateActivityLogInput,
): Promise<ActivityLogWithRelations> {
  return prisma.activityLog.create({
    data: {
      workspaceId,
      linkedinAccountId: input.linkedinAccountId ?? null,
      campaignId: input.campaignId ?? null,
      leadId: input.leadId ?? null,
      action: input.action,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
    include: { linkedinAccount: true, campaign: true, lead: true },
  });
}

/**
 * Get dashboard KPI stats — aggregated from campaigns.
 */
export async function getDashboardStats(
  workspaceId: string,
  timeRange: TimeRange = "30d",
  campaignId?: string,
): Promise<DashboardStats> {
  const where: Prisma.CampaignWhereInput = {
    workspaceId,
    ...(campaignId && { id: campaignId }),
  };

  // If time range applied, only count campaigns created within range
  const dateThreshold = getDateThreshold(timeRange);
  if (dateThreshold) {
    where.createdAt = { gte: dateThreshold };
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    select: {
      connectionsSent: true,
      connectionsAccepted: true,
      messagesSent: true,
      repliesReceived: true,
      opportunitiesValue: true,
    },
  });

  return campaigns.reduce<DashboardStats>(
    (acc, campaign) => ({
      connectionsSent: acc.connectionsSent + campaign.connectionsSent,
      connectionsAccepted:
        acc.connectionsAccepted + campaign.connectionsAccepted,
      messagesSent: acc.messagesSent + campaign.messagesSent,
      repliesReceived: acc.repliesReceived + campaign.repliesReceived,
      opportunitiesValue:
        acc.opportunitiesValue + Number(campaign.opportunitiesValue),
    }),
    {
      connectionsSent: 0,
      connectionsAccepted: 0,
      messagesSent: 0,
      repliesReceived: 0,
      opportunitiesValue: 0,
    },
  );
}

/**
 * Get per-account stats for the dashboard analytics table.
 */
export async function getAccountAnalytics(
  workspaceId: string,
  timeRange: TimeRange = "30d",
): Promise<
  Array<{
    accountId: string;
    accountName: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: number;
  }>
> {
  const dateThreshold = getDateThreshold(timeRange);

  const accounts = await prisma.linkedinAccount.findMany({
    where: { workspaceId },
    select: {
      id: true,
      accountName: true,
      campaignAccounts: {
        include: {
          campaign: {
            select: {
              connectionsSent: true,
              connectionsAccepted: true,
              messagesSent: true,
              repliesReceived: true,
              opportunitiesValue: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return accounts.map((account) => {
    const campaigns = account.campaignAccounts
      .map((ca) => ca.campaign)
      .filter((c) => !dateThreshold || c.createdAt >= dateThreshold);

    return {
      accountId: account.id,
      accountName: account.accountName,
      connectionsSent: campaigns.reduce(
        (sum, c) => sum + c.connectionsSent,
        0,
      ),
      connectionsAccepted: campaigns.reduce(
        (sum, c) => sum + c.connectionsAccepted,
        0,
      ),
      messagesSent: campaigns.reduce((sum, c) => sum + c.messagesSent, 0),
      repliesReceived: campaigns.reduce(
        (sum, c) => sum + c.repliesReceived,
        0,
      ),
      opportunitiesValue: campaigns.reduce(
        (sum, c) => sum + Number(c.opportunitiesValue),
        0,
      ),
    };
  });
}

/**
 * Get activity timeline data (for dashboard chart).
 */
export async function getActivityTimeline(
  workspaceId: string,
  timeRange: TimeRange = "30d",
): Promise<
  Array<{
    date: string;
    connectionsSent: number;
    messagesSent: number;
    repliesReceived: number;
  }>
> {
  const dateThreshold = getDateThreshold(timeRange);

  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      action: {
        in: ["connection_sent", "message_sent", "reply_received"],
      },
      ...(dateThreshold && { createdAt: { gte: dateThreshold } }),
    },
    select: {
      action: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<
    string,
    { connectionsSent: number; messagesSent: number; repliesReceived: number }
  >();

  for (const log of logs) {
    const dateKey = log.createdAt.toISOString().split("T")[0];
    const entry = dateMap.get(dateKey) ?? {
      connectionsSent: 0,
      messagesSent: 0,
      repliesReceived: 0,
    };

    if (log.action === "connection_sent") entry.connectionsSent++;
    else if (log.action === "message_sent") entry.messagesSent++;
    else if (log.action === "reply_received") entry.repliesReceived++;

    dateMap.set(dateKey, entry);
  }

  return Array.from(dateMap.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
