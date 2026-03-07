// Copyright (c) Said Borna. All rights reserved.
// Velaris — Queue Status API Route

import { NextResponse } from "next/server";
import { getAllQueueStatuses } from "@/lib/queue/jobs";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * GET /api/queue/status
 * Returns current status of all BullMQ job queues.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const statuses = await getAllQueueStatuses();
    return NextResponse.json({ queues: statuses }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Queue Status API]", errorMessage);

    return NextResponse.json(
      { error: "Failed to fetch queue status" },
      { status: 500 }
    );
  }
}
