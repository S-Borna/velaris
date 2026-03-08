// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { Message, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface ConversationSummary {
  leadId: string;
  leadName: string | null;
  leadTitle: string | null;
  leadCompany: string | null;
  leadAvatarUrl: string | null;
  linkedinAccountId: string | null;
  linkedinAccountName: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  lastMessageDirection: string | null;
  unreadCount: number;
  campaignName: string | null;
}

export interface MessageCreateData {
  linkedinAccountId?: string;
  leadId?: string;
  campaignId?: string;
  direction: string;
  content: string;
  messageType?: string;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List conversations grouped by lead, with last message and unread count.
 */
export async function listConversations(
  workspaceId: string,
  params: {
    filter?: "all" | "unread" | "starred" | "archived";
    search?: string;
    accountId?: string;
  } = {}
): Promise<ConversationSummary[]> {
  const { filter, search, accountId } = params;

  // Get all leads that have messages in this workspace
  const where: Prisma.MessageWhereInput = {
    workspaceId,
    leadId: { not: null },
    ...(accountId ? { linkedinAccountId: accountId } : {}),
    ...(filter === "starred" ? { starred: true } : {}),
    ...(filter === "unread" ? { read: false, direction: "received" } : {}),
  };

  // Get distinct lead IDs with messages
  const messages = await prisma.message.findMany({
    where,
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          title: true,
          company: true,
          avatarUrl: true,
        },
      },
      linkedinAccount: {
        select: {
          id: true,
          accountName: true,
        },
      },
      campaign: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  // Group by leadId, pick latest message per lead
  const conversationMap = new Map<string, ConversationSummary>();

  for (const msg of messages) {
    if (!msg.leadId) continue;

    const leadId = msg.leadId;
    if (conversationMap.has(leadId)) {
      // Only increment unread count
      if (!msg.read && msg.direction === "received") {
        const existing = conversationMap.get(leadId)!;
        existing.unreadCount += 1;
      }
      continue;
    }

    conversationMap.set(leadId, {
      leadId,
      leadName: msg.lead?.fullName ?? null,
      leadTitle: msg.lead?.title ?? null,
      leadCompany: msg.lead?.company ?? null,
      leadAvatarUrl: msg.lead?.avatarUrl ?? null,
      linkedinAccountId: msg.linkedinAccountId,
      linkedinAccountName: msg.linkedinAccount?.accountName ?? null,
      lastMessage: msg.content,
      lastMessageAt: msg.sentAt,
      lastMessageDirection: msg.direction,
      unreadCount: !msg.read && msg.direction === "received" ? 1 : 0,
      campaignName: msg.campaign?.name ?? null,
    });
  }

  let conversations = Array.from(conversationMap.values());

  // Apply search filter
  if (search) {
    const lower = search.toLowerCase();
    conversations = conversations.filter(
      (c) =>
        c.leadName?.toLowerCase().includes(lower) ||
        c.lastMessage.toLowerCase().includes(lower)
    );
  }

  // Sort by last message time
  conversations.sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  );

  return conversations;
}

/**
 * List messages between a specific lead and account.
 */
export async function listMessagesByLead(
  workspaceId: string,
  leadId: string,
  linkedinAccountId?: string
): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      workspaceId,
      leadId,
      ...(linkedinAccountId ? { linkedinAccountId } : {}),
    },
    orderBy: { sentAt: "asc" },
  });
}

/**
 * Create a new message.
 */
export async function createMessage(
  workspaceId: string,
  data: MessageCreateData
): Promise<Message> {
  return prisma.message.create({
    data: {
      workspaceId,
      linkedinAccountId: data.linkedinAccountId,
      leadId: data.leadId,
      campaignId: data.campaignId,
      direction: data.direction,
      content: data.content,
      messageType: data.messageType ?? "text",
      read: data.direction === "sent",
    },
  });
}

/**
 * Mark a message as read.
 */
export async function markAsRead(
  workspaceId: string,
  messageId: string
): Promise<Message> {
  return prisma.message.update({
    where: { id: messageId, workspaceId },
    data: { read: true },
  });
}

/**
 * Mark all messages from a lead as read.
 */
export async function markConversationAsRead(
  workspaceId: string,
  leadId: string
): Promise<{ count: number }> {
  const result = await prisma.message.updateMany({
    where: {
      workspaceId,
      leadId,
      read: false,
      direction: "received",
    },
    data: { read: true },
  });

  return { count: result.count };
}

/**
 * Toggle star on a message.
 */
export async function toggleStar(
  workspaceId: string,
  messageId: string
): Promise<Message> {
  const msg = await prisma.message.findFirst({
    where: { id: messageId, workspaceId },
  });

  if (!msg) {
    throw new Error("Message not found");
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { starred: !msg.starred },
  });
}
