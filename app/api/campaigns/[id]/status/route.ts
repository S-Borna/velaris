// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { updateCampaignStatus } from "@/lib/db/campaigns";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const VALID_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;

/* ─── Schemas ───────────────────────────────────────── */

const StatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handler ─────────────────────────────────── */

/**
 * PATCH /api/campaigns/[id]/status — Update campaign status only.
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
    const parsed = StatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const campaign = await updateCampaignStatus(workspaceId, id, parsed.data.status);
    return NextResponse.json(campaign);
  } catch (error: unknown) {
    console.error("PATCH /api/campaigns/[id]/status error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
