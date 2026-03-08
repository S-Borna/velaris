// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { Sequence } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface SequenceCreateData {
  stepOrder: number;
  actionType: string;
  messageTemplate?: string;
  waitDays?: number;
  conditionType?: string;
  conditionValue?: string;
}

export interface SequenceUpdateData {
  stepOrder?: number;
  actionType?: string;
  messageTemplate?: string;
  waitDays?: number;
  conditionType?: string;
  conditionValue?: string;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List all sequence steps for a campaign, ordered by stepOrder.
 */
export async function listSequences(
  workspaceId: string,
  campaignId: string
): Promise<Sequence[]> {
  return prisma.sequence.findMany({
    where: {
      campaignId,
      campaign: { workspaceId },
    },
    orderBy: { stepOrder: "asc" },
  });
}

/**
 * Create a single sequence step.
 */
export async function createSequence(
  workspaceId: string,
  campaignId: string,
  data: SequenceCreateData
): Promise<Sequence> {
  // Verify campaign belongs to workspace
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return prisma.sequence.create({
    data: {
      campaignId,
      stepOrder: data.stepOrder,
      actionType: data.actionType,
      messageTemplate: data.messageTemplate,
      waitDays: data.waitDays ?? 1,
      conditionType: data.conditionType,
      conditionValue: data.conditionValue,
    },
  });
}

/**
 * Update a sequence step.
 */
export async function updateSequence(
  workspaceId: string,
  sequenceId: string,
  data: SequenceUpdateData
): Promise<Sequence> {
  const existing = await prisma.sequence.findFirst({
    where: {
      id: sequenceId,
      campaign: { workspaceId },
    },
  });

  if (!existing) {
    throw new Error("Sequence not found");
  }

  return prisma.sequence.update({
    where: { id: sequenceId },
    data,
  });
}

/**
 * Replace all sequences for a campaign (delete + recreate).
 * Used when saving the full sequence builder state.
 */
export async function replaceSequences(
  workspaceId: string,
  campaignId: string,
  sequences: SequenceCreateData[]
): Promise<Sequence[]> {
  // Verify campaign belongs to workspace
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Delete all existing sequences and recreate
  await prisma.sequence.deleteMany({ where: { campaignId } });

  const created = await Promise.all(
    sequences.map((seq, index) =>
      prisma.sequence.create({
        data: {
          campaignId,
          stepOrder: seq.stepOrder ?? index,
          actionType: seq.actionType,
          messageTemplate: seq.messageTemplate,
          waitDays: seq.waitDays ?? 1,
          conditionType: seq.conditionType,
          conditionValue: seq.conditionValue,
        },
      })
    )
  );

  return created;
}

/**
 * Reorder sequence steps by providing ordered IDs.
 */
export async function reorderSequences(
  workspaceId: string,
  campaignId: string,
  orderedIds: string[]
): Promise<void> {
  // Verify campaign belongs to workspace
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.sequence.update({
        where: { id },
        data: { stepOrder: index },
      })
    )
  );
}

/**
 * Delete a single sequence step.
 */
export async function deleteSequence(
  workspaceId: string,
  sequenceId: string
): Promise<Sequence> {
  const existing = await prisma.sequence.findFirst({
    where: {
      id: sequenceId,
      campaign: { workspaceId },
    },
  });

  if (!existing) {
    throw new Error("Sequence not found");
  }

  return prisma.sequence.delete({
    where: { id: sequenceId },
  });
}
