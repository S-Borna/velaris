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

/** Message with related lead and account info. */
export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: {
    lead: true;
    linkedinAccount: true;
    campaign: true;
  };
}>;

/** Conversation summary (grouped by lead). */
export interface ConversationSummary {
  leadId: string;
  leadName: string;
  leadTitle: string | null;
  leadCompany: string | null;
  leadAvatarUrl: string | null;
  linkedinAccountId: string | null;
  linkedinAccountName: string | null;
  lastMessage: string;
  lastMessageDirection: string | null;
  lastMessageAt: Date;
  unreadCount: number;
  isStarred: boolean;
  campaignName: string | null;
}

/** Input for creating a message. */
export interface CreateMessageInput {
  linkedinAccountId?: string;
  leadId?: string;
  campaignId?: string;
  direction: string;
  content: string;
  messageType?: string;
}

// ─── Queries ────────────────────────────────────────────

/**
 * Get conversation list — latest message per lead, with unread counts.
 */
export async function listConversations(
  workspaceId: string,
  filters: {
    search?: string;
    linkedinAccountId?: string;
    unreadOnly?: boolean;
    starredOnly?: boolean;
  } = {},
): Promise<ConversationSummary[]> {
  // Get all leads that have messages in this workspace
  const leadMessages = await prisma.message.findMany({
    where: {
      workspaceId,
      leadId: { not: null },
      ...(filters.linkedinAccountId && {
        linkedinAccountId: filters.linkedinAccountId,
      }),
    },
    include: {
      lead: true,
      linkedinAccount: true,
      campaign: true,
    },
    orderBy: { sentAt: "desc" },
  });

  // Group by leadId and build conversation summaries
  const conversationsMap = new Map<string, ConversationSummary>();

  for (const msg of leadMessages) {
    if (!msg.leadId || !msg.lead) continue;

    const existing = conversationsMap.get(msg.leadId);

    if (!existing) {
      conversationsMap.set(msg.leadId, {
        leadId: msg.leadId,
        leadName: msg.lead.fullName ?? `${msg.lead.firstName ?? ""} ${msg.lead.lastName ?? ""}`.trim(),
        leadTitle: msg.lead.title,
        leadCompany: msg.lead.company,
        leadAvatarUrl: msg.lead.avatarUrl,
        linkedinAccountId: msg.linkedinAccountId,
        linkedinAccountName: msg.linkedinAccount?.accountName ?? null,
        lastMessage: msg.content,
        lastMessageDirection: msg.direction,
        lastMessageAt: msg.sentAt,
        unreadCount: !msg.read && msg.direction === "received" ? 1 : 0,
        isStarred: msg.starred,
        campaignName: msg.campaign?.name ?? null,
      });
    } else {
      if (!msg.read && msg.direction === "received") {
        existing.unreadCount++;
      }
      if (msg.starred) {
        existing.isStarred = true;
      }
    }
  }

  let conversations = Array.from(conversationsMap.values());

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    conversations = conversations.filter(
      (c) =>
        c.leadName.toLowerCase().includes(searchLower) ||
        c.leadCompany?.toLowerCase().includes(searchLower) ||
        c.lastMessage.toLowerCase().includes(searchLower),
    );
  }

  if (filters.unreadOnly) {
    conversations = conversations.filter((c) => c.unreadCount > 0);
  }

  if (filters.starredOnly) {
    conversations = conversations.filter((c) => c.isStarred);
  }

  // Sort by latest message
  conversations.sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
  );

  return conversations;
}

/**
 * Get all messages for a specific conversation (between account and lead).
 */
export async function getConversationMessages(
  workspaceId: string,
  leadId: string,
  pagination: PaginationParams = {},
): Promise<PaginatedResult<MessageWithRelations>> {
  const { skip, take, page, pageSize } = getPaginationValues({
    ...pagination,
    pageSize: pagination.pageSize ?? 50,
  });

  const where: Prisma.MessageWhereInput = { workspaceId, leadId };

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { lead: true, linkedinAccount: true, campaign: true },
      orderBy: { sentAt: "asc" },
      skip,
      take,
    }),
    prisma.message.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Create a new message.
 */
export async function createMessage(
  workspaceId: string,
  input: CreateMessageInput,
): Promise<MessageWithRelations> {
  return prisma.message.create({
    data: {
      workspaceId,
      linkedinAccountId: input.linkedinAccountId ?? null,
      leadId: input.leadId ?? null,
      campaignId: input.campaignId ?? null,
      direction: input.direction,
      content: input.content,
      messageType: input.messageType ?? "text",
    },
    include: { lead: true, linkedinAccount: true, campaign: true },
  });
}

/**
 * Mark a message as read.
 */
export async function markMessageRead(
  messageId: string,
): Promise<MessageWithRelations | null> {
  const existing = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!existing) return null;

  return prisma.message.update({
    where: { id: messageId },
    data: { read: true },
    include: { lead: true, linkedinAccount: true, campaign: true },
  });
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markConversationRead(
  workspaceId: string,
  leadId: string,
): Promise<number> {
  const result = await prisma.message.updateMany({
    where: {
      workspaceId,
      leadId,
      read: false,
      direction: "received",
    },
    data: { read: true },
  });
  return result.count;
}

/**
 * Toggle star on a message.
 */
export async function toggleMessageStar(
  messageId: string,
): Promise<MessageWithRelations | null> {
  const existing = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!existing) return null;

  return prisma.message.update({
    where: { id: messageId },
    data: { starred: !existing.starred },
    include: { lead: true, linkedinAccount: true, campaign: true },
  });
}

/**
 * Get unread message count for a workspace.
 */
export async function getUnreadCount(
  workspaceId: string,
): Promise<number> {
  return prisma.message.count({
    where: {
      workspaceId,
      read: false,
      direction: "received",
    },
  });
}
