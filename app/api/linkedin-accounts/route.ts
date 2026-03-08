// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { listAccounts, createAccount } from "@/lib/db/linkedin-accounts";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const CreateAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  linkedinUrl: z.string().url().optional(),
  status: z.string().optional(),
  accountType: z.string().optional(),
  dailyConnectionLimit: z.number().min(1).max(100).optional(),
  dailyMessageLimit: z.number().min(1).max(200).optional(),
  sessionCookie: z.string().optional(),
  proxyUrl: z.string().optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/linkedin-accounts — List all LinkedIn accounts.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const accounts = await listAccounts(workspaceId);

    return NextResponse.json(accounts);
  } catch (error: unknown) {
    console.error("GET /api/linkedin-accounts error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/linkedin-accounts — Add a new LinkedIn account.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const account = await createAccount(workspaceId, parsed.data);
    return NextResponse.json(account, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/linkedin-accounts error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
