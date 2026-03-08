// Copyright (c) Said Borna. All rights reserved.
// Velaris — Queue Status API Route

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAllQueueStatuses } from "@/lib/queue/jobs";
import { authOptions } from "@/lib/auth/options";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Failed to fetch queue status.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * GET /api/queue/status
 * Returns current status of all BullMQ job queues.
 * Requires authentication.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statuses = await getAllQueueStatuses();
    return NextResponse.json({ queues: statuses }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Queue Status API]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
