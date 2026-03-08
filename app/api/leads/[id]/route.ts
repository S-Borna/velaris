// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { getLeadById, updateLead, deleteLead } from "@/lib/db/leads";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "Lead not found";

/* ─── Schemas ───────────────────────────────────────── */

const UpdateLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  icpScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  enrichmentStatus: z.string().optional(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/leads/[id] — Get a single lead.
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
    const lead = await getLeadById(workspaceId, id);

    if (!lead) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: unknown) {
    console.error("GET /api/leads/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[id] — Update a lead.
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
    const parsed = UpdateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const lead = await updateLead(workspaceId, id, parsed.data);
    return NextResponse.json(lead);
  } catch (error: unknown) {
    console.error("PATCH /api/leads/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id] — Delete a lead.
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
    await deleteLead(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/leads/[id] error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
