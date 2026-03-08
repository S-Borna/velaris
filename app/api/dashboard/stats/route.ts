// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { getDashboardStats } from "@/lib/db/activity-log";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * GET /api/dashboard/stats — Get dashboard KPI stats.
 * Query: timeRange (1d|1w|1m), campaignId
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const url = request.nextUrl;

    const timeRange = (url.searchParams.get("timeRange") as "1d" | "1w" | "1m") ?? undefined;
    const campaignId = url.searchParams.get("campaignId") ?? undefined;

    const stats = await getDashboardStats(workspaceId, { timeRange, campaignId });
    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
