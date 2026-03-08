// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  getAutomationById,
  updateAutomation,
  deleteAutomation,
} from "@/lib/db/automations";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "Automation not found";

/* ─── Schemas ───────────────────────────────────────── */

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).optional(),
  postUrl: z.string().url().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  autoReplyComment: z.string().optional(),
  autoDmMessage: z.string().optional(),
  status: z.string().optional(),
  triggersCount: z.number().min(0).optional(),
  linkedinAccountIds: z.array(z.string().uuid()).optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/automations/[id] — Get a single automation.
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
    const automation = await getAutomationById(workspaceId, id);

    if (!automation) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(automation);
  } catch (error: unknown) {
    console.error("GET /api/automations/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PATCH /api/automations/[id] — Update an automation.
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
    const parsed = UpdateAutomationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const automation = await updateAutomation(workspaceId, id, parsed.data);
    return NextResponse.json(automation);
  } catch (error: unknown) {
    console.error("PATCH /api/automations/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * DELETE /api/automations/[id] — Delete an automation.
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
    await deleteAutomation(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/automations/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
