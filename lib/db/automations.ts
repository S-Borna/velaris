// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { InboundAutomation, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface AutomationCreateData {
  name: string;
  postUrl?: string;
  triggerKeywords?: string[];
  autoReplyComment?: string;
  autoDmMessage?: string;
  status?: string;
  linkedinAccountIds?: string[];
}

export interface AutomationUpdateData {
  name?: string;
  postUrl?: string;
  triggerKeywords?: string[];
  autoReplyComment?: string;
  autoDmMessage?: string;
  status?: string;
  triggersCount?: number;
  linkedinAccountIds?: string[];
}

export interface AutomationWithAccounts extends InboundAutomation {
  accounts: Array<{
    linkedinAccountId: string;
    linkedinAccount: {
      id: string;
      accountName: string;
    };
  }>;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List all inbound automations for a workspace.
 */
export async function listAutomations(
  workspaceId: string
): Promise<AutomationWithAccounts[]> {
  const automations = await prisma.inboundAutomation.findMany({
    where: { workspaceId },
    include: {
      accounts: {
        include: {
          linkedinAccount: {
            select: {
              id: true,
              accountName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return automations as AutomationWithAccounts[];
}

/**
 * Get a single automation by ID, scoped to workspace.
 */
export async function getAutomationById(
  workspaceId: string,
  automationId: string
): Promise<AutomationWithAccounts | null> {
  const automation = await prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
    include: {
      accounts: {
        include: {
          linkedinAccount: {
            select: {
              id: true,
              accountName: true,
            },
          },
        },
      },
    },
  });

  return automation as AutomationWithAccounts | null;
}

/**
 * Create a new inbound automation with account assignments.
 */
export async function createAutomation(
  workspaceId: string,
  data: AutomationCreateData
): Promise<InboundAutomation> {
  const automation = await prisma.inboundAutomation.create({
    data: {
      workspaceId,
      name: data.name,
      postUrl: data.postUrl,
      triggerKeywords: data.triggerKeywords ?? [],
      autoReplyComment: data.autoReplyComment,
      autoDmMessage: data.autoDmMessage,
      status: data.status ?? "paused",
    },
  });

  // Assign LinkedIn accounts if provided
  if (data.linkedinAccountIds && data.linkedinAccountIds.length > 0) {
    await prisma.inboundAutomationAccount.createMany({
      data: data.linkedinAccountIds.map((accountId) => ({
        automationId: automation.id,
        linkedinAccountId: accountId,
      })),
    });
  }

  return automation;
}

/**
 * Update an inbound automation.
 */
export async function updateAutomation(
  workspaceId: string,
  automationId: string,
  data: AutomationUpdateData
): Promise<InboundAutomation> {
  const { linkedinAccountIds, ...updateData } = data;

  const automation = await prisma.inboundAutomation.update({
    where: { id: automationId, workspaceId },
    data: updateData,
  });

  // Reassign accounts if provided
  if (linkedinAccountIds !== undefined) {
    await prisma.inboundAutomationAccount.deleteMany({
      where: { automationId },
    });

    if (linkedinAccountIds.length > 0) {
      await prisma.inboundAutomationAccount.createMany({
        data: linkedinAccountIds.map((accountId) => ({
          automationId,
          linkedinAccountId: accountId,
        })),
      });
    }
  }

  return automation;
}

/**
 * Change automation status only (active/paused).
 */
export async function updateAutomationStatus(
  workspaceId: string,
  automationId: string,
  status: string
): Promise<InboundAutomation> {
  return prisma.inboundAutomation.update({
    where: { id: automationId, workspaceId },
    data: { status },
  });
}

/**
 * Delete an inbound automation.
 */
export async function deleteAutomation(
  workspaceId: string,
  automationId: string
): Promise<InboundAutomation> {
  return prisma.inboundAutomation.delete({
    where: { id: automationId, workspaceId },
  });
}
