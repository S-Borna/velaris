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

/** Inbound automation with linked accounts. */
export type AutomationWithAccounts = Prisma.InboundAutomationGetPayload<{
  include: {
    accounts: {
      include: { linkedinAccount: true };
    };
  };
}>;

/** Filters for listing automations. */
export interface AutomationFilters {
  status?: string;
  search?: string;
}

/** Input for creating an automation. */
export interface CreateAutomationInput {
  name: string;
  postUrl?: string;
  triggerKeywords?: string[];
  autoReplyComment?: string;
  autoDmMessage?: string;
  linkedinAccountIds?: string[];
}

/** Input for updating an automation. */
export interface UpdateAutomationInput {
  name?: string;
  postUrl?: string;
  triggerKeywords?: string[];
  autoReplyComment?: string;
  autoDmMessage?: string;
}

// ─── Queries ────────────────────────────────────────────

const AUTOMATION_INCLUDE = {
  accounts: {
    include: { linkedinAccount: true },
  },
} satisfies Prisma.InboundAutomationInclude;

/**
 * List inbound automations — filtered, paginated.
 */
export async function listAutomations(
  workspaceId: string,
  filters: AutomationFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<AutomationWithAccounts>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const where: Prisma.InboundAutomationWhereInput = {
    workspaceId,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.inboundAutomation.findMany({
      where,
      include: AUTOMATION_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.inboundAutomation.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Get a single automation by ID (workspace-scoped).
 */
export async function getAutomationById(
  workspaceId: string,
  automationId: string,
): Promise<AutomationWithAccounts | null> {
  return prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
    include: AUTOMATION_INCLUDE,
  });
}

/**
 * Create an inbound automation with linked accounts.
 */
export async function createAutomation(
  workspaceId: string,
  input: CreateAutomationInput,
): Promise<AutomationWithAccounts> {
  return prisma.inboundAutomation.create({
    data: {
      workspaceId,
      name: input.name,
      postUrl: input.postUrl ?? null,
      triggerKeywords: input.triggerKeywords ?? [],
      autoReplyComment: input.autoReplyComment ?? null,
      autoDmMessage: input.autoDmMessage ?? null,
      status: "paused",
      ...(input.linkedinAccountIds?.length && {
        accounts: {
          create: input.linkedinAccountIds.map((accountId) => ({
            linkedinAccountId: accountId,
          })),
        },
      }),
    },
    include: AUTOMATION_INCLUDE,
  });
}

/**
 * Update an inbound automation.
 */
export async function updateAutomation(
  workspaceId: string,
  automationId: string,
  input: UpdateAutomationInput,
): Promise<AutomationWithAccounts | null> {
  const existing = await prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!existing) return null;

  return prisma.inboundAutomation.update({
    where: { id: automationId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.postUrl !== undefined && { postUrl: input.postUrl }),
      ...(input.triggerKeywords !== undefined && {
        triggerKeywords: input.triggerKeywords,
      }),
      ...(input.autoReplyComment !== undefined && {
        autoReplyComment: input.autoReplyComment,
      }),
      ...(input.autoDmMessage !== undefined && {
        autoDmMessage: input.autoDmMessage,
      }),
    },
    include: AUTOMATION_INCLUDE,
  });
}

/**
 * Toggle automation status (active ↔ paused).
 */
export async function updateAutomationStatus(
  workspaceId: string,
  automationId: string,
  status: string,
): Promise<AutomationWithAccounts | null> {
  const existing = await prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!existing) return null;

  return prisma.inboundAutomation.update({
    where: { id: automationId },
    data: { status },
    include: AUTOMATION_INCLUDE,
  });
}

/**
 * Set the linked LinkedIn accounts for an automation (replace all).
 */
export async function setAutomationAccounts(
  workspaceId: string,
  automationId: string,
  linkedinAccountIds: string[],
): Promise<AutomationWithAccounts | null> {
  const existing = await prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!existing) return null;

  await prisma.$transaction([
    prisma.inboundAutomationAccount.deleteMany({
      where: { automationId },
    }),
    ...linkedinAccountIds.map((accountId) =>
      prisma.inboundAutomationAccount.create({
        data: { automationId, linkedinAccountId: accountId },
      }),
    ),
  ]);

  return prisma.inboundAutomation.findUnique({
    where: { id: automationId },
    include: AUTOMATION_INCLUDE,
  });
}

/**
 * Delete an inbound automation.
 */
export async function deleteAutomation(
  workspaceId: string,
  automationId: string,
): Promise<boolean> {
  const existing = await prisma.inboundAutomation.findFirst({
    where: { id: automationId, workspaceId },
  });

  if (!existing) return false;

  await prisma.inboundAutomation.delete({ where: { id: automationId } });
  return true;
}

/**
 * Increment trigger count for an automation.
 */
export async function incrementTriggerCount(
  automationId: string,
): Promise<void> {
  await prisma.inboundAutomation.update({
    where: { id: automationId },
    data: { triggersCount: { increment: 1 } },
  });
}

/**
 * Get active automations with their trigger keywords (for monitoring worker).
 */
export async function getActiveAutomations(): Promise<AutomationWithAccounts[]> {
  return prisma.inboundAutomation.findMany({
    where: { status: "active" },
    include: AUTOMATION_INCLUDE,
  });
}
