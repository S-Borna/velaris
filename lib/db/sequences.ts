// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────

/** Sequence step record. */
export type SequenceRecord = Prisma.SequenceGetPayload<Record<string, never>>;

/** Input for creating a sequence step. */
export interface CreateSequenceInput {
  stepOrder: number;
  actionType: string;
  messageTemplate?: string;
  waitDays?: number;
  conditionType?: string;
  conditionValue?: string;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List all sequence steps for a campaign, ordered by stepOrder.
 */
export async function listSequences(
  campaignId: string,
): Promise<SequenceRecord[]> {
  return prisma.sequence.findMany({
    where: { campaignId },
    orderBy: { stepOrder: "asc" },
  });
}

/**
 * Create a new sequence step in a campaign.
 */
export async function createSequence(
  campaignId: string,
  input: CreateSequenceInput,
): Promise<SequenceRecord> {
  return prisma.sequence.create({
    data: {
      campaignId,
      stepOrder: input.stepOrder,
      actionType: input.actionType,
      messageTemplate: input.messageTemplate ?? null,
      waitDays: input.waitDays ?? 1,
      conditionType: input.conditionType ?? null,
      conditionValue: input.conditionValue ?? null,
    },
  });
}

/**
 * Replace all sequences for a campaign (used by visual flowchart builder).
 * Deletes existing sequences and creates new ones in a transaction.
 */
export async function replaceSequences(
  campaignId: string,
  sequences: CreateSequenceInput[],
): Promise<SequenceRecord[]> {
  await prisma.sequence.deleteMany({ where: { campaignId } });

  const created = await Promise.all(
    sequences.map((input) =>
      prisma.sequence.create({
        data: {
          campaignId,
          stepOrder: input.stepOrder,
          actionType: input.actionType,
          messageTemplate: input.messageTemplate ?? null,
          waitDays: input.waitDays ?? 1,
          conditionType: input.conditionType ?? null,
          conditionValue: input.conditionValue ?? null,
        },
      }),
    ),
  );

  return created;
}

/**
 * Update a single sequence step.
 */
export async function updateSequence(
  sequenceId: string,
  input: Partial<CreateSequenceInput>,
): Promise<SequenceRecord | null> {
  const existing = await prisma.sequence.findUnique({
    where: { id: sequenceId },
  });

  if (!existing) return null;

  return prisma.sequence.update({
    where: { id: sequenceId },
    data: {
      ...(input.stepOrder !== undefined && { stepOrder: input.stepOrder }),
      ...(input.actionType !== undefined && { actionType: input.actionType }),
      ...(input.messageTemplate !== undefined && { messageTemplate: input.messageTemplate }),
      ...(input.waitDays !== undefined && { waitDays: input.waitDays }),
      ...(input.conditionType !== undefined && { conditionType: input.conditionType }),
      ...(input.conditionValue !== undefined && { conditionValue: input.conditionValue }),
    },
  });
}

/**
 * Delete a sequence step.
 */
export async function deleteSequence(
  sequenceId: string,
): Promise<boolean> {
  const existing = await prisma.sequence.findUnique({
    where: { id: sequenceId },
  });

  if (!existing) return false;

  await prisma.sequence.delete({ where: { id: sequenceId } });
  return true;
}

/**
 * Get the next sequence step for a campaign lead based on current step.
 */
export async function getNextSequenceStep(
  campaignId: string,
  currentStepOrder: number,
): Promise<SequenceRecord | null> {
  return prisma.sequence.findFirst({
    where: {
      campaignId,
      stepOrder: { gt: currentStepOrder },
    },
    orderBy: { stepOrder: "asc" },
  });
}
