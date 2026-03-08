// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { listLeads, createLead } from "@/lib/db/leads";

/* ─── Constants ─────────────────────────────────────── */

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

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
  icpScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

/* ─── Route Handlers ────────────────────────────────── */

/**
 * GET /api/leads — List leads with pagination and filters.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const url = request.nextUrl;

    const page = Number(url.searchParams.get("page") ?? DEFAULT_PAGE);
    const pageSize = Number(url.searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
    const search = url.searchParams.get("search") ?? undefined;
    const sort = url.searchParams.get("sort") ?? undefined;
    const order = (url.searchParams.get("order") as "asc" | "desc") ?? undefined;
    const source = url.searchParams.get("source") ?? undefined;
    const minIcpScore = url.searchParams.get("minIcpScore")
      ? Number(url.searchParams.get("minIcpScore"))
      : undefined;
    const maxIcpScore = url.searchParams.get("maxIcpScore")
      ? Number(url.searchParams.get("maxIcpScore"))
      : undefined;

    const locations = url.searchParams.get("locations")?.split(",").filter(Boolean) ?? undefined;
    const industries = url.searchParams.get("industries")?.split(",").filter(Boolean) ?? undefined;
    const companySizes = url.searchParams.get("companySizes")?.split(",").filter(Boolean) ?? undefined;

    const result = await listLeads(workspaceId, {
      page,
      pageSize,
      search,
      sort,
      order,
      source,
      minIcpScore,
      maxIcpScore,
      locations,
      industries,
      companySizes,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * POST /api/leads — Create a single lead.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const body: unknown = await request.json();
    const parsed = CreateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const lead = await createLead(workspaceId, parsed.data);
    return NextResponse.json(lead, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
