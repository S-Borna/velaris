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

/** Content post with linked account info. */
export type ContentPostWithAccount = Prisma.ContentPostGetPayload<{
  include: { linkedinAccount: true };
}>;

/** Filters for listing content posts. */
export interface ContentPostFilters {
  status?: string;
  category?: string;
  language?: string;
  linkedinAccountId?: string;
  search?: string;
}

/** Input for creating a content post. */
export interface CreateContentPostInput {
  category?: string;
  topic?: string;
  targetAudience?: string;
  language?: string;
  tone?: string;
  generatedContent?: string;
  linkedinAccountId?: string;
}

/** Input for updating a content post. */
export interface UpdateContentPostInput {
  category?: string;
  topic?: string;
  targetAudience?: string;
  language?: string;
  tone?: string;
  generatedContent?: string;
  status?: string;
  linkedinAccountId?: string;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List content posts for a workspace — filtered, paginated.
 */
export async function listContentPosts(
  workspaceId: string,
  filters: ContentPostFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<ContentPostWithAccount>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const where: Prisma.ContentPostWhereInput = {
    workspaceId,
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { category: filters.category }),
    ...(filters.language && { language: filters.language }),
    ...(filters.linkedinAccountId && {
      linkedinAccountId: filters.linkedinAccountId,
    }),
    ...(filters.search && {
      OR: [
        { topic: { contains: filters.search, mode: "insensitive" } },
        {
          generatedContent: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          targetAudience: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      include: { linkedinAccount: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.contentPost.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Get a single content post by ID (workspace-scoped).
 */
export async function getContentPostById(
  workspaceId: string,
  postId: string,
): Promise<ContentPostWithAccount | null> {
  return prisma.contentPost.findFirst({
    where: { id: postId, workspaceId },
    include: { linkedinAccount: true },
  });
}

/**
 * Create a new content post.
 */
export async function createContentPost(
  workspaceId: string,
  input: CreateContentPostInput,
): Promise<ContentPostWithAccount> {
  return prisma.contentPost.create({
    data: {
      workspaceId,
      category: input.category ?? null,
      topic: input.topic ?? null,
      targetAudience: input.targetAudience ?? null,
      language: input.language ?? "en",
      tone: input.tone ?? "professional",
      generatedContent: input.generatedContent ?? null,
      linkedinAccountId: input.linkedinAccountId ?? null,
      status: "draft",
    },
    include: { linkedinAccount: true },
  });
}

/**
 * Update a content post.
 */
export async function updateContentPost(
  workspaceId: string,
  postId: string,
  input: UpdateContentPostInput,
): Promise<ContentPostWithAccount | null> {
  const existing = await prisma.contentPost.findFirst({
    where: { id: postId, workspaceId },
  });

  if (!existing) return null;

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      ...(input.category !== undefined && { category: input.category }),
      ...(input.topic !== undefined && { topic: input.topic }),
      ...(input.targetAudience !== undefined && {
        targetAudience: input.targetAudience,
      }),
      ...(input.language !== undefined && { language: input.language }),
      ...(input.tone !== undefined && { tone: input.tone }),
      ...(input.generatedContent !== undefined && {
        generatedContent: input.generatedContent,
      }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.linkedinAccountId !== undefined && {
        linkedinAccountId: input.linkedinAccountId,
      }),
    },
    include: { linkedinAccount: true },
  });
}

/**
 * Schedule a content post.
 */
export async function scheduleContentPost(
  workspaceId: string,
  postId: string,
  scheduledAt: Date,
  linkedinAccountId: string,
): Promise<ContentPostWithAccount | null> {
  const existing = await prisma.contentPost.findFirst({
    where: { id: postId, workspaceId },
  });

  if (!existing) return null;

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      status: "scheduled",
      scheduledAt,
      linkedinAccountId,
    },
    include: { linkedinAccount: true },
  });
}

/**
 * Mark a content post as posted.
 */
export async function markContentPostPosted(
  postId: string,
): Promise<ContentPostWithAccount | null> {
  const existing = await prisma.contentPost.findUnique({
    where: { id: postId },
  });

  if (!existing) return null;

  return prisma.contentPost.update({
    where: { id: postId },
    data: {
      status: "posted",
      postedAt: new Date(),
    },
    include: { linkedinAccount: true },
  });
}

/**
 * Delete a content post.
 */
export async function deleteContentPost(
  workspaceId: string,
  postId: string,
): Promise<boolean> {
  const existing = await prisma.contentPost.findFirst({
    where: { id: postId, workspaceId },
  });

  if (!existing) return false;

  await prisma.contentPost.delete({ where: { id: postId } });
  return true;
}

/**
 * Get posts that are scheduled and due for publishing.
 */
export async function getScheduledPostsDue(): Promise<ContentPostWithAccount[]> {
  return prisma.contentPost.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: new Date() },
      linkedinAccountId: { not: null },
    },
    include: { linkedinAccount: true },
    orderBy: { scheduledAt: "asc" },
  });
}
