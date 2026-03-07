// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { listLeads, createLead } from "@/lib/db/leads";

const CreateLeadSchema = z.object({
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
  tags: z.array(z.string()).optional(),
  source: z.enum(["csv", "extractor", "database", "inbound"]).optional(),
});

/**
 * GET /api/leads
 * List leads for the workspace — filtered, paginated, sortable.
 *
 * Query: ?page=1&pageSize=25&search=keyword&source=csv&company=Acme
 *        &sortBy=createdAt&sortOrder=desc
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const result = await listLeads(
      ctx.workspaceId,
      {
        search: url.searchParams.get("search") ?? undefined,
        source: url.searchParams.get("source") ?? undefined,
        enrichmentStatus: url.searchParams.get("enrichmentStatus") ?? undefined,
        company: url.searchParams.get("company") ?? undefined,
        industry: url.searchParams.get("industry") ?? undefined,
        location: url.searchParams.get("location") ?? undefined,
        companySize: url.searchParams.get("companySize") ?? undefined,
        tags: url.searchParams.get("tags")?.split(",") ?? undefined,
        icpScoreMin: url.searchParams.get("icpScoreMin")
          ? parseInt(url.searchParams.get("icpScoreMin") as string, 10)
          : undefined,
        icpScoreMax: url.searchParams.get("icpScoreMax")
          ? parseInt(url.searchParams.get("icpScoreMax") as string, 10)
          : undefined,
        sortBy: url.searchParams.get("sortBy") ?? undefined,
        sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
      },
      {
        page: parseInt(url.searchParams.get("page") ?? "1", 10),
        pageSize: parseInt(url.searchParams.get("pageSize") ?? "25", 10),
      },
    );

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateLeadSchema.parse(body);

    const lead = await createLead(ctx.workspaceId, input);
    return NextResponse.json({ data: lead }, { status: 201 });
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
      { error: "Failed to create lead" },
      { status: 500 },
    );
  }
}
