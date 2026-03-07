// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { scheduleContentPost } from "@/lib/db/content-posts";

const SchedulePostSchema = z.object({
  scheduledAt: z.string().datetime("Invalid datetime format"),
  linkedinAccountId: z.string().uuid("Invalid LinkedIn account ID"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/content-posts/[id]/schedule
 * Schedule a content post for publishing.
 */
export async function POST(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = SchedulePostSchema.parse(body);

    const post = await scheduleContentPost(
      ctx.workspaceId,
      id,
      new Date(input.scheduledAt),
      input.linkedinAccountId,
    );

    if (!post) {
      return NextResponse.json(
        { error: "Content post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: post });
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
      { error: "Failed to schedule content post" },
      { status: 500 },
    );
  }
}
