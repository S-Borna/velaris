// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { updateCampaignStatus } from "@/lib/db/campaigns";

const StatusSchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "archived"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/campaigns/[id]/status
 * Update campaign status (start, pause, complete, archive).
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const { status } = StatusSchema.parse(body);

    const campaign = await updateCampaignStatus(ctx.workspaceId, id, status);

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
      { error: "Failed to update campaign status" },
      { status: 500 },
    );
  }
}
