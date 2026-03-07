// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────

/** User profile data. */
export type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    fullName: true;
    avatarUrl: true;
    emailVerified: true;
    createdAt: true;
  };
}>;

/** Workspace with member count. */
export type WorkspaceWithMembers = Prisma.WorkspaceGetPayload<{
  include: {
    members: {
      include: { user: true };
    };
    _count: {
      select: { linkedinAccounts: true };
    };
  };
}>;

/** Input for updating user profile. */
export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string;
}

/** Input for updating workspace settings. */
export interface UpdateWorkspaceInput {
  name?: string;
  plan?: string;
}

// ─── User Profile ───────────────────────────────────────

/**
 * Get user profile by ID.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

/**
 * Update user profile.
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfile | null> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) return null;

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

// ─── Workspace ──────────────────────────────────────────

/**
 * Get workspace with members and account count.
 */
export async function getWorkspace(
  workspaceId: string,
): Promise<WorkspaceWithMembers | null> {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { linkedinAccounts: true },
      },
    },
  });
}

/**
 * Update workspace settings.
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<WorkspaceWithMembers | null> {
  const existing = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!existing) return null;

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.plan !== undefined && { plan: input.plan }),
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { linkedinAccounts: true },
      },
    },
  });
}

/**
 * List all workspaces a user belongs to.
 */
export async function listUserWorkspaces(
  userId: string,
): Promise<
  Array<{
    workspaceId: string;
    workspaceName: string;
    plan: string;
    role: string;
    memberCount: number;
    linkedinAccountCount: number;
    createdAt: Date;
  }>
> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              linkedinAccounts: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    workspaceId: m.workspace.id,
    workspaceName: m.workspace.name,
    plan: m.workspace.plan,
    role: m.role,
    memberCount: m.workspace._count.members,
    linkedinAccountCount: m.workspace._count.linkedinAccounts,
    createdAt: m.workspace.createdAt,
  }));
}

/**
 * Add a member to a workspace.
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: string = "member",
): Promise<boolean> {
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (existing) return false;

  await prisma.workspaceMember.create({
    data: { workspaceId, userId, role },
  });

  return true;
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: string,
): Promise<boolean> {
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!existing) return false;

  await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    data: { role },
  });

  return true;
}

/**
 * Remove a member from a workspace.
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!existing) return false;

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  return true;
}
