// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { ContentPost, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface ContentPostListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ContentPostCreateData {
  category?: string;
  topic?: string;
  targetAudience?: string;
  language?: string;
  tone?: string;
  generatedContent?: string;
  status?: string;
  scheduledAt?: Date;
  linkedinAccountId?: string;
}

export interface ContentPostUpdateData {
  category?: string;
  topic?: string;
  targetAudience?: string;
  language?: string;
  tone?: string;
  generatedContent?: string;
  status?: string;
  scheduledAt?: Date | null;
  linkedinAccountId?: string | null;
  postedAt?: Date | null;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List content posts for a workspace with optional status filter.
 */
export async function listPosts(
  workspaceId: string,
  params: ContentPostListParams = {}
): Promise<PaginatedResult<ContentPost>> {
  const { page = 1, pageSize = 20, status } = params;

  const where: Prisma.ContentPostWhereInput = {
    workspaceId,
    ...(status ? { status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.contentPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contentPost.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single content post by ID, scoped to workspace.
 */
export async function getPostById(
  workspaceId: string,
  postId: string
): Promise<ContentPost | null> {
  return prisma.contentPost.findFirst({
    where: { id: postId, workspaceId },
  });
}

/**
 * Create a new content post.
 */
export async function createPost(
  workspaceId: string,
  data: ContentPostCreateData
): Promise<ContentPost> {
  return prisma.contentPost.create({
    data: {
      workspaceId,
      category: data.category,
      topic: data.topic,
      targetAudience: data.targetAudience,
      language: data.language ?? "en",
      tone: data.tone ?? "professional",
      generatedContent: data.generatedContent,
      status: data.status ?? "draft",
      scheduledAt: data.scheduledAt,
      linkedinAccountId: data.linkedinAccountId,
    },
  });
}

/**
 * Update a content post.
 */
export async function updatePost(
  workspaceId: string,
  postId: string,
  data: ContentPostUpdateData
): Promise<ContentPost> {
  return prisma.contentPost.update({
    where: { id: postId, workspaceId },
    data,
  });
}

/**
 * Schedule a content post for publishing.
 */
export async function schedulePost(
  workspaceId: string,
  postId: string,
  scheduledAt: Date,
  linkedinAccountId: string
): Promise<ContentPost> {
  return prisma.contentPost.update({
    where: { id: postId, workspaceId },
    data: {
      status: "scheduled",
      scheduledAt,
      linkedinAccountId,
    },
  });
}

/**
 * Mark a content post as posted.
 */
export async function markAsPosted(
  workspaceId: string,
  postId: string
): Promise<ContentPost> {
  return prisma.contentPost.update({
    where: { id: postId, workspaceId },
    data: {
      status: "posted",
      postedAt: new Date(),
    },
  });
}

/**
 * Delete a content post.
 */
export async function deletePost(
  workspaceId: string,
  postId: string
): Promise<ContentPost> {
  return prisma.contentPost.delete({
    where: { id: postId, workspaceId },
  });
}
