// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getWorkspace,
  updateWorkspace,
  listUserWorkspaces,
} from "@/lib/db/settings";

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

/**
 * GET /api/settings/workspace
 * Get current workspace details or list all workspaces.
 *
 * Query: ?list=true (returns all workspaces for user)
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);
    const listAll = url.searchParams.get("list") === "true";

    if (listAll) {
      const workspaces = await listUserWorkspaces(ctx.userId);
      return NextResponse.json({ data: workspaces });
    }

    const workspace = await getWorkspace(ctx.workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: workspace });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load workspace" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/settings/workspace
 * Update workspace settings.
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = UpdateWorkspaceSchema.parse(body);

    const workspace = await updateWorkspace(ctx.workspaceId, input);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: workspace });
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
      { error: "Failed to update workspace" },
      { status: 500 },
    );
  }
}
