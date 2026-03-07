// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { listAutomations, createAutomation } from "@/lib/db/automations";

const CreateAutomationSchema = z.object({
  name: z.string().min(1, "Automation name is required").max(200),
  postUrl: z.string().url().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  autoReplyComment: z.string().optional(),
  autoDmMessage: z.string().optional(),
  linkedinAccountIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/automations
 * List inbound automations — filtered, paginated.
 *
 * Query: ?page=1&pageSize=25&status=active&search=keyword
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const result = await listAutomations(
      ctx.workspaceId,
      {
        status: url.searchParams.get("status") ?? undefined,
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
      { error: "Failed to load automations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/automations
 * Create a new inbound automation.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateAutomationSchema.parse(body);

    const automation = await createAutomation(ctx.workspaceId, input);
    return NextResponse.json({ data: automation }, { status: 201 });
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
      { error: "Failed to create automation" },
      { status: 500 },
    );
  }
}
