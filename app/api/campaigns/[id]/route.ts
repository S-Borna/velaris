// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
} from "@/lib/db/campaigns";

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  scheduleTimezone: z.string().optional(),
  scheduleStartHour: z.number().int().min(0).max(23).optional(),
  scheduleEndHour: z.number().int().min(0).max(23).optional(),
  scheduleDays: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]
 * Get a single campaign by ID.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const campaign = await getCampaignById(ctx.workspaceId, id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load campaign" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Update campaign details.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = UpdateCampaignSchema.parse(body);

    const campaign = await updateCampaign(ctx.workspaceId, id, input);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign.
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const deleted = await deleteCampaign(ctx.workspaceId, id);

    if (!deleted) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/campaigns/[id]
 * Duplicate a campaign (special action via POST on existing resource).
 */
export async function POST(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();

    const actionSchema = z.object({ action: z.literal("duplicate") });
    actionSchema.parse(body);

    const campaign = await duplicateCampaign(ctx.workspaceId, id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to duplicate campaign" },
      { status: 500 },
    );
  }
}
