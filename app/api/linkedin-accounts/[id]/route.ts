// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  getLinkedinAccountById,
  updateLinkedinAccount,
  deleteLinkedinAccount,
} from "@/lib/db/linkedin-accounts";

const UpdateAccountSchema = z.object({
  accountName: z.string().min(1).max(200).optional(),
  linkedinUrl: z.string().url().optional(),
  accountType: z.enum(["basic", "premium", "sales_navigator"]).optional(),
  dailyConnectionLimit: z.number().int().min(1).max(100).optional(),
  dailyMessageLimit: z.number().int().min(1).max(200).optional(),
  proxyUrl: z.string().url().nullable().optional(),
  status: z.enum(["connected", "disconnected", "syncing", "error"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/linkedin-accounts/[id]
 * Get a single LinkedIn account.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const account = await getLinkedinAccountById(ctx.workspaceId, id);

    if (!account) {
      return NextResponse.json(
        { error: "LinkedIn account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: account });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load LinkedIn account" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/linkedin-accounts/[id]
 * Update LinkedIn account settings.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = UpdateAccountSchema.parse(body);

    const account = await updateLinkedinAccount(ctx.workspaceId, id, input);

    if (!account) {
      return NextResponse.json(
        { error: "LinkedIn account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: account });
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
      { error: "Failed to update LinkedIn account" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/linkedin-accounts/[id]
 * Delete a LinkedIn account.
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const deleted = await deleteLinkedinAccount(ctx.workspaceId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "LinkedIn account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete LinkedIn account" },
      { status: 500 },
    );
  }
}
