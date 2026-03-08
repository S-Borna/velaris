// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  markAsRead,
  markConversationAsRead,
  toggleStar,
} from "@/lib/db/messages";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const UpdateMessageSchema = z.object({
  action: z.enum(["markRead", "markConversationRead", "toggleStar"]),
  leadId: z.string().uuid().optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handler ─────────────────────────────────── */

/**
 * PATCH /api/messages/[id] — Update a message (read/star).
 * Body: { action: "markRead" | "markConversationRead" | "toggleStar", leadId?: string }
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
    const parsed = UpdateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { action, leadId } = parsed.data;

    switch (action) {
      case "markRead": {
        const result = await markAsRead(workspaceId, id);
        return NextResponse.json(result);
      }
      case "markConversationRead": {
        if (!leadId) {
          return NextResponse.json(
            { error: "leadId is required for markConversationRead" },
            { status: 400 }
          );
        }
        const result = await markConversationAsRead(workspaceId, leadId);
        return NextResponse.json(result);
      }
      case "toggleStar": {
        const result = await toggleStar(workspaceId, id);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("PATCH /api/messages/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
