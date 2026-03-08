// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { User, Workspace } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface ProfileUpdateData {
  fullName?: string;
  avatarUrl?: string;
  // Extended fields stored in metadata (title, timezone)
  // For now we use a simple approach — these map to existing columns
}

export interface WorkspaceUpdateData {
  name?: string;
  plan?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  memberCount: number;
  linkedinAccountCount: number;
}

// ── Queries ──────────────────────────────────────────────

/**
 * Get user profile by user ID.
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Update user profile.
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
    },
  });
}

/**
 * Get workspace info including member and account counts.
 */
export async function getWorkspace(
  workspaceId: string
): Promise<WorkspaceInfo | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          members: true,
          linkedinAccounts: true,
        },
      },
    },
  });

  if (!workspace) return null;

  return {
    id: workspace.id,
    name: workspace.name,
    plan: workspace.plan,
    createdAt: workspace.createdAt,
    memberCount: workspace._count.members,
    linkedinAccountCount: workspace._count.linkedinAccounts,
  };
}

/**
 * Update workspace settings.
 */
export async function updateWorkspace(
  workspaceId: string,
  data: WorkspaceUpdateData
): Promise<Workspace> {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
}
