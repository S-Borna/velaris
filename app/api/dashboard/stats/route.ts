// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getDashboardStats,
  getAccountAnalytics,
  type TimeRange,
} from "@/lib/db/activity-log";

const VALID_RANGES: TimeRange[] = ["1d", "7d", "30d", "90d", "all"];

/**
 * GET /api/dashboard/stats
 * Returns KPI stats + per-account analytics for the dashboard.
 *
 * Query: ?range=30d&campaignId=xxx
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const rangeParam = url.searchParams.get("range") ?? "30d";
    const range: TimeRange = VALID_RANGES.includes(rangeParam as TimeRange)
      ? (rangeParam as TimeRange)
      : "30d";
    const campaignId = url.searchParams.get("campaignId") ?? undefined;

    const [stats, accountAnalytics] = await Promise.all([
      getDashboardStats(ctx.workspaceId, range, campaignId),
      getAccountAnalytics(ctx.workspaceId, range),
    ]);

    return NextResponse.json({ data: { stats, accountAnalytics } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 },
    );
  }
}
