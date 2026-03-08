// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { bulkCreateLeads } from "@/lib/db/leads";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";
const MAX_IMPORT_SIZE = 5000;

/* ─── Schemas ───────────────────────────────────────── */

const LeadRowSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  linkedinUrl: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  icpScore: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const ImportSchema = z.object({
  leads: z.array(LeadRowSchema).min(1).max(MAX_IMPORT_SIZE),
  source: z.string().optional(),
});

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/leads/import — Bulk import leads (from CSV or other sources).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = ImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const leadsWithSource = parsed.data.leads.map((lead) => ({
      ...lead,
      source: parsed.data.source ?? "csv",
    }));

    const result = await bulkCreateLeads(workspaceId, leadsWithSource);
    return NextResponse.json(
      { imported: result.count, total: parsed.data.leads.length },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/leads/import error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
