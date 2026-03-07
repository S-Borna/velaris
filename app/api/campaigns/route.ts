// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import {
  listCampaigns,
  createCampaign,
} from "@/lib/db/campaigns";

const CreateCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  scheduleTimezone: z.string().optional(),
  scheduleStartHour: z.number().int().min(0).max(23).optional(),
  scheduleEndHour: z.number().int().min(0).max(23).optional(),
  scheduleDays: z.array(z.string()).optional(),
});

/**
 * GET /api/campaigns
 * List campaigns for the workspace — filtered, paginated.
 *
 * Query: ?page=1&pageSize=25&status=active&search=keyword
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const url = new URL(request.url);

    const result = await listCampaigns(
      ctx.workspaceId,
      {
        status: url.searchParams.get("status") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
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
      { error: "Failed to load campaigns" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = CreateCampaignSchema.parse(body);

    const campaign = await createCampaign(ctx.workspaceId, input);
    return NextResponse.json({ data: campaign }, { status: 201 });
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
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
