// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  listLinkedinAccounts,
  createLinkedinAccount,
} from "@/lib/db/linkedin-accounts";

const CreateAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required").max(200),
  linkedinUrl: z.string().url().optional(),
  accountType: z.enum(["basic", "premium", "sales_navigator"]).optional(),
  dailyConnectionLimit: z.number().int().min(1).max(100).optional(),
  dailyMessageLimit: z.number().int().min(1).max(200).optional(),
  proxyUrl: z.string().url().optional(),
});

/**
 * GET /api/linkedin-accounts
 * List LinkedIn accounts for the workspace.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const accounts = await listLinkedinAccounts(ctx.workspaceId);

    return NextResponse.json({ data: accounts });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load LinkedIn accounts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/linkedin-accounts
 * Add a new LinkedIn account.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateAccountSchema.parse(body);

    const account = await createLinkedinAccount(ctx.workspaceId, input);
    return NextResponse.json({ data: account }, { status: 201 });
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
      { error: "Failed to add LinkedIn account" },
      { status: 500 },
    );
  }
}
