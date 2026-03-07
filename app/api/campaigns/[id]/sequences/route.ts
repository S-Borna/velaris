// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  listSequences,
  replaceSequences,
} from "@/lib/db/sequences";
import { setCampaignAccounts } from "@/lib/db/campaigns";

const SequenceStepSchema = z.object({
  stepOrder: z.number().int().min(0),
  actionType: z.enum([
    "connect",
    "message",
    "follow_up",
    "voice_note",
    "view_profile",
    "like_post",
    "wait",
  ]),
  messageTemplate: z.string().optional(),
  waitDays: z.number().int().min(0).optional(),
  conditionType: z
    .enum([
      "always",
      "if_connected",
      "if_not_connected",
      "if_replied",
      "if_not_replied",
      "if_icp_above",
    ])
    .optional(),
  conditionValue: z.string().optional(),
});

const ReplaceSequencesSchema = z.object({
  steps: z.array(SequenceStepSchema).min(1, "At least one step required"),
  linkedinAccountIds: z.array(z.string().uuid()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]/sequences
 * List sequence steps for a campaign.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    await getAuthContext();
    const { id } = await params;
    const sequences = await listSequences(id);

    return NextResponse.json({ data: sequences });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load sequences" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/campaigns/[id]/sequences
 * Replace all sequence steps for a campaign (from visual builder save).
 * Also optionally sets linked LinkedIn accounts.
 */
export async function PUT(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = ReplaceSequencesSchema.parse(body);

    const sequences = await replaceSequences(id, input.steps);

    if (input.linkedinAccountIds) {
      await setCampaignAccounts(ctx.workspaceId, id, input.linkedinAccountIds);
    }

    return NextResponse.json({ data: sequences });
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
      { error: "Failed to save sequences" },
      { status: 500 },
    );
  }
}
