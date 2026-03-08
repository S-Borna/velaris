// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { listPosts, createPost } from "@/lib/db/content-posts";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const CreatePostSchema = z.object({
  category: z.string().optional(),
  topic: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  generatedContent: z.string().optional(),
  status: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  linkedinAccountId: z.string().uuid().optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/content-posts — List content posts.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const url = request.nextUrl;

    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const status = url.searchParams.get("status") ?? undefined;

    const result = await listPosts(workspaceId, { page, pageSize, status });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET /api/content-posts error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/content-posts — Create a new content post.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const postData = {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    };

    const post = await createPost(workspaceId, postData);
    return NextResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/content-posts error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
