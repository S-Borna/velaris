// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  getPostById,
  updatePost,
  deletePost,
} from "@/lib/db/content-posts";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "Content post not found";

/* ─── Schemas ───────────────────────────────────────── */

const UpdatePostSchema = z.object({
  category: z.string().optional(),
  topic: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  generatedContent: z.string().optional(),
  status: z.string().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  linkedinAccountId: z.string().uuid().nullable().optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/content-posts/[id] — Get a single content post.
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
    const post = await getPostById(workspaceId, id);

    if (!post) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: unknown) {
    console.error("GET /api/content-posts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PATCH /api/content-posts/[id] — Update a content post.
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
    const parsed = UpdatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData = {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt !== undefined
        ? (parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null)
        : undefined,
    };

    const post = await updatePost(workspaceId, id, updateData);
    return NextResponse.json(post);
  } catch (error: unknown) {
    console.error("PATCH /api/content-posts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * DELETE /api/content-posts/[id] — Delete a content post.
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
    await deletePost(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/content-posts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
