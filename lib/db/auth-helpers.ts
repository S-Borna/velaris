// Copyright (c) Said Borna. All rights reserved.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

/**
 * Auth context returned from session resolution.
 * Contains both user and workspace identifiers for scoped queries.
 */
export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}

/**
 * Resolve the current server session into a workspace-scoped auth context.
 * Looks up the first workspace membership for the authenticated user.
 *
 * @throws Error if session is missing or user has no workspace membership.
 * @returns AuthContext with userId, workspaceId, and role.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized: no active session");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    throw new Error("Unauthorized: no workspace membership");
  }

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
  };
}

/**
 * Resolve auth context for a specific workspace (when user has multiple).
 *
 * @param targetWorkspaceId - The workspace to resolve for.
 * @throws Error if session is missing or user is not a member of that workspace.
 * @returns AuthContext scoped to the specified workspace.
 */
export async function getAuthContextForWorkspace(
  targetWorkspaceId: string,
): Promise<AuthContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized: no active session");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: targetWorkspaceId,
        userId: session.user.id,
      },
    },
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    throw new Error("Unauthorized: not a member of this workspace");
  }

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
  };
}
