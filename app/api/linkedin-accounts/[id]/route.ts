// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  getAccountById,
  updateAccount,
  deleteAccount,
} from "@/lib/db/linkedin-accounts";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "LinkedIn account not found";

/* ─── Schemas ───────────────────────────────────────── */

const UpdateAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  linkedinUrl: z.string().url().optional(),
  status: z.string().optional(),
  accountType: z.string().optional(),
  dailyConnectionLimit: z.number().min(1).max(100).optional(),
  dailyMessageLimit: z.number().min(1).max(200).optional(),
  dailyConnectionsUsed: z.number().min(0).optional(),
  dailyMessagesUsed: z.number().min(0).optional(),
  sessionCookie: z.string().optional(),
  proxyUrl: z.string().optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/linkedin-accounts/[id] — Get a single LinkedIn account.
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
    const account = await getAccountById(workspaceId, id);

    if (!account) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error("GET /api/linkedin-accounts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PATCH /api/linkedin-accounts/[id] — Update a LinkedIn account.
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
    const parsed = UpdateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const account = await updateAccount(workspaceId, id, parsed.data);
    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error("PATCH /api/linkedin-accounts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * DELETE /api/linkedin-accounts/[id] — Delete a LinkedIn account.
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
    await deleteAccount(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/linkedin-accounts/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
