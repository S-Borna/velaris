// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getAutomationById,
  updateAutomation,
  updateAutomationStatus,
  setAutomationAccounts,
  deleteAutomation,
} from "@/lib/db/automations";

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  postUrl: z.string().url().nullable().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  autoReplyComment: z.string().nullable().optional(),
  autoDmMessage: z.string().nullable().optional(),
  status: z.enum(["active", "paused"]).optional(),
  linkedinAccountIds: z.array(z.string().uuid()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/automations/[id]
 * Get a single automation.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const automation = await getAutomationById(ctx.workspaceId, id);

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: automation });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load automation" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/automations/[id]
 * Update automation details, status, or linked accounts.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = UpdateAutomationSchema.parse(body);

    let automation;

    // Handle status update separately
    if (input.status) {
      automation = await updateAutomationStatus(ctx.workspaceId, id, input.status);
    }

    // Handle account linking
    if (input.linkedinAccountIds) {
      automation = await setAutomationAccounts(
        ctx.workspaceId,
        id,
        input.linkedinAccountIds,
      );
    }

    // Handle other field updates
    const { status: _s, linkedinAccountIds: _l, ...fieldUpdates } = input;
    const hasFieldUpdates = Object.values(fieldUpdates).some(
      (v) => v !== undefined,
    );

    if (hasFieldUpdates) {
      automation = await updateAutomation(ctx.workspaceId, id, fieldUpdates);
    }

    if (!automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: automation });
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
      { error: "Failed to update automation" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/automations/[id]
 * Delete an automation.
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const deleted = await deleteAutomation(ctx.workspaceId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 },
    );
  }
}
