// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  listCampaignLeads,
  assignLeadsToCampaign,
} from "@/lib/db/campaign-leads";

/* ─── Constants ─────────────────────────────────────── */

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;
const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const AssignLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "At least one lead is required"),
  linkedinAccountId: z.string().uuid().optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/campaigns/[id]/leads — List leads in a campaign.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const { id } = await context.params;
    const url = request.nextUrl;

    const page = Number(url.searchParams.get("page") ?? DEFAULT_PAGE);
    const pageSize = Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
    const status = url.searchParams.get("status") ?? undefined;

    const result = await listCampaignLeads(workspaceId, id, {
      page,
      pageSize,
      status,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET /api/campaigns/[id]/leads error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/campaigns/[id]/leads — Assign leads to a campaign.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = AssignLeadsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await assignLeadsToCampaign(
      workspaceId,
      id,
      parsed.data.leadIds,
      parsed.data.linkedinAccountId
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/campaigns/[id]/leads error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
