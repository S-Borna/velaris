// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  listConversations,
  getConversationMessages,
  createMessage,
  markConversationRead,
} from "@/lib/db/messages";

const CreateMessageSchema = z.object({
  leadId: z.string().uuid(),
  linkedinAccountId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  direction: z.enum(["sent", "received"]),
  content: z.string().min(1, "Message content is required"),
  messageType: z.enum(["text", "voice_note", "connection_request", "inmail"]).optional(),
});

/**
 * GET /api/messages
 * List conversations (grouped by lead) or messages for a specific lead.
 *
 * Query: ?leadId=xxx (returns thread) | no leadId (returns conversation list)
 *        &search=keyword&linkedinAccountId=xxx&unreadOnly=true&starredOnly=true
 *        &page=1&pageSize=50
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);
    const leadId = url.searchParams.get("leadId");

    if (leadId) {
      // Get conversation thread for specific lead
      const messages = await getConversationMessages(
        ctx.workspaceId,
        leadId,
        {
          page: parseInt(url.searchParams.get("page") ?? "1", 10),
          pageSize: parseInt(url.searchParams.get("pageSize") ?? "50", 10),
        },
      );
      return NextResponse.json({ data: messages });
    }

    // Get conversation list
    const conversations = await listConversations(ctx.workspaceId, {
      search: url.searchParams.get("search") ?? undefined,
      linkedinAccountId: url.searchParams.get("linkedinAccountId") ?? undefined,
      unreadOnly: url.searchParams.get("unreadOnly") === "true",
      starredOnly: url.searchParams.get("starredOnly") === "true",
    });

    return NextResponse.json({ data: conversations });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages
 * Send a new message (record in DB).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateMessageSchema.parse(body);

    const message = await createMessage(ctx.workspaceId, input);
    return NextResponse.json({ data: message }, { status: 201 });
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
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/messages
 * Bulk action: mark all messages in a conversation as read.
 * Body: { leadId: string }
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const schema = z.object({ leadId: z.string().uuid() });
    const { leadId } = schema.parse(body);

    const count = await markConversationRead(ctx.workspaceId, leadId);
    return NextResponse.json({ data: { markedRead: count } });
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
      { error: "Failed to mark conversation read" },
      { status: 500 },
    );
  }
}
