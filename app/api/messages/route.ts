// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  listConversations,
  listMessagesByLead,
  createMessage,
} from "@/lib/db/messages";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const CreateMessageSchema = z.object({
  linkedinAccountId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  direction: z.enum(["sent", "received"]),
  content: z.string().min(1, "Message content is required"),
  messageType: z.string().optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/messages — List conversations or messages for a lead.
 * Query params:
 *   - leadId: if provided, return messages for this lead
 *   - filter: "all" | "unread" | "starred"
 *   - search: search term
 *   - accountId: filter by LinkedIn account
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const url = request.nextUrl;

    const leadId = url.searchParams.get("leadId");

    if (leadId) {
      const linkedinAccountId = url.searchParams.get("linkedinAccountId") ?? undefined;
      const messages = await listMessagesByLead(workspaceId, leadId, linkedinAccountId);
      return NextResponse.json(messages);
    }

    const filter = (url.searchParams.get("filter") as "all" | "unread" | "starred") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const accountId = url.searchParams.get("accountId") ?? undefined;

    const conversations = await listConversations(workspaceId, {
      filter,
      search,
      accountId,
    });

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/messages — Send a new message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const message = await createMessage(workspaceId, parsed.data);
    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
