// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { markMessageRead, toggleMessageStar } from "@/lib/db/messages";

const PatchMessageSchema = z.object({
  action: z.enum(["markRead", "toggleStar"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/messages/[id]
 * Mark a message as read or toggle star.
 * Body: { action: "markRead" | "toggleStar" }
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const { action } = PatchMessageSchema.parse(body);

    let message;
    if (action === "markRead") {
      message = await markMessageRead(id);
    } else {
      message = await toggleMessageStar(id);
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: message });
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
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}
