// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import {
  listSequences,
  createSequence,
  replaceSequences,
} from "@/lib/db/sequences";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const SequenceStepSchema = z.object({
  stepOrder: z.number().min(0),
  actionType: z.string().min(1),
  messageTemplate: z.string().optional(),
  waitDays: z.number().min(0).optional(),
  conditionType: z.string().optional(),
  conditionValue: z.string().optional(),
});

const CreateSequenceSchema = SequenceStepSchema;

const ReplaceSequencesSchema = z.object({
  steps: z.array(SequenceStepSchema),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/campaigns/[id]/sequences — List all sequence steps.
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
    const sequences = await listSequences(workspaceId, id);

    return NextResponse.json(sequences);
  } catch (error: unknown) {
    console.error("GET /api/campaigns/[id]/sequences error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/campaigns/[id]/sequences — Add a single sequence step.
 */
export async function POST(
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
    const parsed = CreateSequenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const sequence = await createSequence(workspaceId, id, parsed.data);
    return NextResponse.json(sequence, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/campaigns/[id]/sequences error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PUT /api/campaigns/[id]/sequences — Replace all sequence steps (save builder).
 */
export async function PUT(
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
    const parsed = ReplaceSequencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const sequences = await replaceSequences(workspaceId, id, parsed.data.steps);
    return NextResponse.json(sequences);
  } catch (error: unknown) {
    console.error("PUT /api/campaigns/[id]/sequences error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
