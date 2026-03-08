// Copyright (c) Said Borna. All rights reserved.
import type { Session } from "next-auth";
import { prisma } from "./prisma";

/**
 * Given a NextAuth session, resolve the user's active workspace ID.
 * Returns the first workspace the user is a member of (owner takes priority).
 * Throws if no workspace membership exists.
 */
export async function getWorkspaceIdFromSession(
  session: Session
): Promise<string> {
  const userId = session.user.id;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { role: "asc" }, // "owner" < "member" alphabetically → owner first
    select: { workspaceId: true },
  });

  if (!membership) {
    throw new Error("No workspace found for user");
  }

  return membership.workspaceId;
}

/**
 * Verify that a user belongs to a specific workspace.
 * Returns true if the user is a member, false otherwise.
 */
export async function isWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  return membership !== null;
}
