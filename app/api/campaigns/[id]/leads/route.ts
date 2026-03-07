// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  listCampaignLeads,
  assignLeadsToCampaign,
  removeLeadFromCampaign,
  getCampaignLeadStatusCounts,
} from "@/lib/db/campaign-leads";

const AssignLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "At least one lead ID required"),
  linkedinAccountId: z.string().uuid().optional(),
});

const RemoveLeadSchema = z.object({
  campaignLeadId: z.string().uuid(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]/leads
 * List leads assigned to a campaign — paginated, with status.
 *
 * Query: ?page=1&pageSize=25&status=pending
 */
export async function GET(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const url = new URL(request.url);

    const [leads, statusCounts] = await Promise.all([
      listCampaignLeads(
        id,
        { status: url.searchParams.get("status") ?? undefined },
        {
          page: parseInt(url.searchParams.get("page") ?? "1", 10),
          pageSize: parseInt(url.searchParams.get("pageSize") ?? "25", 10),
        },
      ),
      getCampaignLeadStatusCounts(id),
    ]);

    return NextResponse.json({ data: { ...leads, statusCounts } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load campaign leads" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/campaigns/[id]/leads
 * Assign leads to a campaign.
 */
export async function POST(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const body: unknown = await request.json();
    const input = AssignLeadsSchema.parse(body);

    const count = await assignLeadsToCampaign(
      id,
      input.leadIds,
      input.linkedinAccountId,
    );

    return NextResponse.json(
      { data: { assignedCount: count } },
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
      { error: "Failed to assign leads" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/campaigns/[id]/leads
 * Remove a lead from a campaign.
 * Body: { campaignLeadId: string }
 */
export async function DELETE(
  request: Request,
  { params: _params }: RouteParams,
): Promise<NextResponse> {
  try {
    await getAuthContext();
    const body: unknown = await request.json();
    const { campaignLeadId } = RemoveLeadSchema.parse(body);

    const removed = await removeLeadFromCampaign(campaignLeadId);

    if (!removed) {
      return NextResponse.json(
        { error: "Campaign lead not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { success: true } });
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
      { error: "Failed to remove lead from campaign" },
      { status: 500 },
    );
  }
}
