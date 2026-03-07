// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getActivityTimeline,
  listActivityLogs,
  type TimeRange,
} from "@/lib/db/activity-log";

const VALID_RANGES: TimeRange[] = ["1d", "7d", "30d", "90d", "all"];

/**
 * GET /api/dashboard/activity
 * Returns activity timeline chart data + recent activity feed.
 *
 * Query: ?range=30d&page=1&pageSize=20
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const rangeParam = url.searchParams.get("range") ?? "30d";
    const range: TimeRange = VALID_RANGES.includes(rangeParam as TimeRange)
      ? (rangeParam as TimeRange)
      : "30d";
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);

    const [timeline, recentActivity] = await Promise.all([
      getActivityTimeline(ctx.workspaceId, range),
      listActivityLogs(ctx.workspaceId, { timeRange: range }, { page, pageSize }),
    ]);

    return NextResponse.json({ data: { timeline, recentActivity } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load activity data" },
      { status: 500 },
    );
  }
}
