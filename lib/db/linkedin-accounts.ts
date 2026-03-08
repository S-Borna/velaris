// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { LinkedinAccount } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface LinkedinAccountCreateData {
  accountName: string;
  linkedinUrl?: string;
  status?: string;
  accountType?: string;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  sessionCookie?: string;
  proxyUrl?: string;
}

export interface LinkedinAccountUpdateData {
  accountName?: string;
  linkedinUrl?: string;
  status?: string;
  accountType?: string;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  dailyConnectionsUsed?: number;
  dailyMessagesUsed?: number;
  sessionCookie?: string;
  proxyUrl?: string;
  lastSyncAt?: Date;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List all LinkedIn accounts for a workspace.
 */
export async function listAccounts(
  workspaceId: string
): Promise<LinkedinAccount[]> {
  return prisma.linkedinAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get a single LinkedIn account by ID, scoped to workspace.
 */
export async function getAccountById(
  workspaceId: string,
  accountId: string
): Promise<LinkedinAccount | null> {
  return prisma.linkedinAccount.findFirst({
    where: { id: accountId, workspaceId },
  });
}

/**
 * Create a new LinkedIn account.
 */
export async function createAccount(
  workspaceId: string,
  data: LinkedinAccountCreateData
): Promise<LinkedinAccount> {
  return prisma.linkedinAccount.create({
    data: {
      workspaceId,
      accountName: data.accountName,
      linkedinUrl: data.linkedinUrl,
      status: data.status ?? "disconnected",
      accountType: data.accountType ?? "basic",
      dailyConnectionLimit: data.dailyConnectionLimit ?? 20,
      dailyMessageLimit: data.dailyMessageLimit ?? 50,
      sessionCookie: data.sessionCookie,
      proxyUrl: data.proxyUrl,
    },
  });
}

/**
 * Update a LinkedIn account.
 */
export async function updateAccount(
  workspaceId: string,
  accountId: string,
  data: LinkedinAccountUpdateData
): Promise<LinkedinAccount> {
  return prisma.linkedinAccount.update({
    where: { id: accountId, workspaceId },
    data,
  });
}

/**
 * Update daily usage counters for a LinkedIn account.
 */
export async function updateAccountUsage(
  workspaceId: string,
  accountId: string,
  usage: { connectionsUsed?: number; messagesUsed?: number }
): Promise<LinkedinAccount> {
  return prisma.linkedinAccount.update({
    where: { id: accountId, workspaceId },
    data: {
      ...(usage.connectionsUsed !== undefined
        ? { dailyConnectionsUsed: usage.connectionsUsed }
        : {}),
      ...(usage.messagesUsed !== undefined
        ? { dailyMessagesUsed: usage.messagesUsed }
        : {}),
    },
  });
}

/**
 * Delete a LinkedIn account.
 */
export async function deleteAccount(
  workspaceId: string,
  accountId: string
): Promise<LinkedinAccount> {
  return prisma.linkedinAccount.delete({
    where: { id: accountId, workspaceId },
  });
}
