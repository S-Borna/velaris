// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getContentPostById,
  updateContentPost,
  deleteContentPost,
} from "@/lib/db/content-posts";

const UpdateContentPostSchema = z.object({
  category: z.string().optional(),
  topic: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  generatedContent: z.string().optional(),
  status: z.enum(["draft", "scheduled", "posted"]).optional(),
  linkedinAccountId: z.string().uuid().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/content-posts/[id]
 * Get a single content post.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const post = await getContentPostById(ctx.workspaceId, id);

    if (!post) {
      return NextResponse.json(
        { error: "Content post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: post });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load content post" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/content-posts/[id]
 * Update a content post.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = UpdateContentPostSchema.parse(body);

    const post = await updateContentPost(ctx.workspaceId, id, input);

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
      { error: "Failed to update content post" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/content-posts/[id]
 * Delete a content post.
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const deleted = await deleteContentPost(ctx.workspaceId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Content post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete content post" },
      { status: 500 },
    );
  }
}
