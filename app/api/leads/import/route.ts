// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { bulkCreateLeads } from "@/lib/db/leads";

const LeadSchema = z.object({
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
  avatarUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(["csv", "extractor", "database", "inbound"]).optional(),
});

const ImportLeadsSchema = z.object({
  leads: z.array(LeadSchema).min(1, "At least one lead required").max(10000),
});

/**
 * POST /api/leads/import
 * Bulk import leads (from CSV or extraction).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const { leads } = ImportLeadsSchema.parse(body);

    const count = await bulkCreateLeads(ctx.workspaceId, leads);

    return NextResponse.json(
      { data: { importedCount: count } },
      { status: 201 },
    );
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
      { error: "Failed to import leads" },
      { status: 500 },
    );
  }
}
