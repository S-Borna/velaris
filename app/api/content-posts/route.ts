// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { listContentPosts, createContentPost } from "@/lib/db/content-posts";

const CreateContentPostSchema = z.object({
  category: z.string().optional(),
  topic: z.string().optional(),
  targetAudience: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  generatedContent: z.string().optional(),
  linkedinAccountId: z.string().uuid().optional(),
});

/**
 * GET /api/content-posts
 * List content posts — filtered, paginated.
 *
 * Query: ?page=1&pageSize=25&status=draft&search=keyword
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const result = await listContentPosts(
      ctx.workspaceId,
      {
        status: url.searchParams.get("status") ?? undefined,
        category: url.searchParams.get("category") ?? undefined,
        language: url.searchParams.get("language") ?? undefined,
        linkedinAccountId: url.searchParams.get("linkedinAccountId") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
      },
      {
        page: parseInt(url.searchParams.get("page") ?? "1", 10),
        pageSize: parseInt(url.searchParams.get("pageSize") ?? "25", 10),
      },
    );

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load content posts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/content-posts
 * Create a new content post (save draft).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateContentPostSchema.parse(body);

    const post = await createContentPost(ctx.workspaceId, input);
    return NextResponse.json({ data: post }, { status: 201 });
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
      { error: "Failed to create content post" },
      { status: 500 },
    );
  }
}
