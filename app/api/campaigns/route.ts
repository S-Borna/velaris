// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { listCampaigns, createCampaign } from "@/lib/db/campaigns";

/* ─── Constants ─────────────────────────────────────── */

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;
const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const CreateCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  status: z.string().optional(),
  scheduleTimezone: z.string().optional(),
  scheduleStartHour: z.number().min(0).max(23).optional(),
  scheduleEndHour: z.number().min(0).max(23).optional(),
  scheduleDays: z.array(z.string()).optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/campaigns — List campaigns with pagination and filters.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const url = request.nextUrl;

    const page = Number(url.searchParams.get("page") ?? DEFAULT_PAGE);
    const pageSize = Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
    const status = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const sort = url.searchParams.get("sort") ?? undefined;
    const order = (url.searchParams.get("order") as "asc" | "desc") ?? undefined;

    const result = await listCampaigns(workspaceId, {
      page,
      pageSize,
      status,
      search,
      sort,
      order,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/campaigns — Create a new campaign.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const campaign = await createCampaign(workspaceId, parsed.data);
    return NextResponse.json(campaign, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
