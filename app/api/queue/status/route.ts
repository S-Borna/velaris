// Copyright (c) Said Borna. All rights reserved.
// Velaris — Queue Status API Route

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAllQueueStatuses } from "@/lib/queue/jobs";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { apiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Failed to fetch queue status.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * GET /api/queue/status
 * Returns current status of all BullMQ job queues.
 * Requires authentication. Workspace-scoped for audit logging.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitResult = apiLimiter.check(getRateLimitKey(request));
    if (!limitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const statuses = await getAllQueueStatuses();
    console.info(`[Queue Status] workspace=${workspaceId}`);
    return NextResponse.json({ queues: statuses }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Queue Status API]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
