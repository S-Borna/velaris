// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────

/** LinkedIn account record. */
export type LinkedinAccountRecord = Prisma.LinkedinAccountGetPayload<Record<string, never>>;

/** Input for creating a LinkedIn account. */
export interface CreateLinkedinAccountInput {
  accountName: string;
  linkedinUrl?: string;
  accountType?: string;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  sessionCookie?: string;
  proxyUrl?: string;
}

/** Input for updating a LinkedIn account. */
export interface UpdateLinkedinAccountInput {
  accountName?: string;
  linkedinUrl?: string;
  status?: string;
  accountType?: string;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  sessionCookie?: string;
  proxyUrl?: string | null;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List all LinkedIn accounts for a workspace.
 */
export async function listLinkedinAccounts(
  workspaceId: string,
): Promise<LinkedinAccountRecord[]> {
  return prisma.linkedinAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single LinkedIn account by ID, scoped to workspace.
 */
export async function getLinkedinAccountById(
  workspaceId: string,
  accountId: string,
): Promise<LinkedinAccountRecord | null> {
  return prisma.linkedinAccount.findFirst({
    where: { id: accountId, workspaceId },
  });
}

/**
 * Create a new LinkedIn account.
 */
export async function createLinkedinAccount(
  workspaceId: string,
  input: CreateLinkedinAccountInput,
): Promise<LinkedinAccountRecord> {
  return prisma.linkedinAccount.create({
    data: {
      workspaceId,
      accountName: input.accountName,
      linkedinUrl: input.linkedinUrl ?? null,
      accountType: input.accountType ?? "basic",
      dailyConnectionLimit: input.dailyConnectionLimit ?? 20,
      dailyMessageLimit: input.dailyMessageLimit ?? 50,
      sessionCookie: input.sessionCookie ?? null,
      proxyUrl: input.proxyUrl ?? null,
    },
  });
}

/**
 * Update a LinkedIn account.
 */
export async function updateLinkedinAccount(
  workspaceId: string,
  accountId: string,
  input: UpdateLinkedinAccountInput,
): Promise<LinkedinAccountRecord | null> {
  const existing = await prisma.linkedinAccount.findFirst({
    where: { id: accountId, workspaceId },
  });

  if (!existing) return null;

  return prisma.linkedinAccount.update({
    where: { id: accountId },
    data: input,
  });
}

/**
 * Delete a LinkedIn account.
 */
export async function deleteLinkedinAccount(
  workspaceId: string,
  accountId: string,
): Promise<boolean> {
  const existing = await prisma.linkedinAccount.findFirst({
    where: { id: accountId, workspaceId },
  });

  if (!existing) return false;

  await prisma.linkedinAccount.delete({ where: { id: accountId } });
  return true;
}

/**
 * Update daily usage counters for an account.
 */
export async function updateAccountUsage(
  accountId: string,
  connectionsUsed?: number,
  messagesUsed?: number,
): Promise<LinkedinAccountRecord> {
  return prisma.linkedinAccount.update({
    where: { id: accountId },
    data: {
      ...(connectionsUsed !== undefined && { dailyConnectionsUsed: connectionsUsed }),
      ...(messagesUsed !== undefined && { dailyMessagesUsed: messagesUsed }),
    },
  });
}

/**
 * Increment daily usage by 1 for a specific action type.
 */
export async function incrementAccountUsage(
  accountId: string,
  actionType: "connection" | "message",
): Promise<LinkedinAccountRecord> {
  return prisma.linkedinAccount.update({
    where: { id: accountId },
    data: {
      ...(actionType === "connection" && {
        dailyConnectionsUsed: { increment: 1 },
      }),
      ...(actionType === "message" && {
        dailyMessagesUsed: { increment: 1 },
      }),
    },
  });
}

/**
 * Reset daily usage counters (called by daily cron job).
 */
export async function resetDailyUsage(
  workspaceId: string,
): Promise<number> {
  const result = await prisma.linkedinAccount.updateMany({
    where: { workspaceId },
    data: {
      dailyConnectionsUsed: 0,
      dailyMessagesUsed: 0,
    },
  });
  return result.count;
}

/**
 * Update account sync status and timestamp.
 */
export async function updateSyncStatus(
  accountId: string,
  status: string,
): Promise<LinkedinAccountRecord> {
  return prisma.linkedinAccount.update({
    where: { id: accountId },
    data: {
      status,
      lastSyncAt: new Date(),
    },
  });
}

/**
 * Get connected account count for a workspace.
 */
export async function getConnectedAccountCount(
  workspaceId: string,
): Promise<number> {
  return prisma.linkedinAccount.count({
    where: { workspaceId, status: "connected" },
  });
}
