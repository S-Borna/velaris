// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "@/lib/db/campaigns";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "Campaign not found";

/* ─── Schemas ───────────────────────────────────────── */

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  totalLeads: z.number().optional(),
  connectionsSent: z.number().optional(),
  connectionsAccepted: z.number().optional(),
  messagesSent: z.number().optional(),
  repliesReceived: z.number().optional(),
  opportunitiesValue: z.number().optional(),
  scheduleTimezone: z.string().optional(),
  scheduleStartHour: z.number().min(0).max(23).optional(),
  scheduleEndHour: z.number().min(0).max(23).optional(),
  scheduleDays: z.array(z.string()).optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/campaigns/[id] — Get a single campaign.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const { id } = await context.params;
    const campaign = await getCampaignById(workspaceId, id);

    if (!campaign) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error: unknown) {
    console.error("GET /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PATCH /api/campaigns/[id] — Update a campaign.
 */
export async function PATCH(
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
    const parsed = UpdateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const campaign = await updateCampaign(workspaceId, id, parsed.data);
    return NextResponse.json(campaign);
  } catch (error: unknown) {
    console.error("PATCH /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * DELETE /api/campaigns/[id] — Delete a campaign.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const { id } = await context.params;
    await deleteCampaign(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
