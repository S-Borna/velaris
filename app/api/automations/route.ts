// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  listAutomations,
  createAutomation,
} from "@/lib/db/automations";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const CreateAutomationSchema = z.object({
  name: z.string().min(1, "Automation name is required"),
  postUrl: z.string().url().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  autoReplyComment: z.string().optional(),
  autoDmMessage: z.string().optional(),
  status: z.string().optional(),
  linkedinAccountIds: z.array(z.string().uuid()).optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/automations — List all inbound automations.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const automations = await listAutomations(workspaceId);

    return NextResponse.json(automations);
  } catch (error: unknown) {
    console.error("GET /api/automations error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/automations — Create a new inbound automation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreateAutomationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const automation = await createAutomation(workspaceId, parsed.data);
    return NextResponse.json(automation, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/automations error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
