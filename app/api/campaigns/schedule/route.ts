// Copyright (c) Said Borna. All rights reserved.
// Velaris — Campaign Launch/Schedule API Route

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ZodError, ZodIssue } from "zod";
import { enqueueCampaignStep } from "@/lib/queue/jobs";
import type { CampaignStepJob } from "@/lib/queue/jobs";

/* ─── Constants ─────────────────────────────────────── */

const MILLISECONDS_PER_DAY = 86400000;

/* ─── Schemas ───────────────────────────────────────── */

const SequenceStepSchema = z.object({
  stepOrder: z.number().min(0),
  actionType: z.string(),
  messageTemplate: z.string().nullable().optional(),
  waitDays: z.number().min(0).default(0),
});

const CampaignScheduleSchema = z.object({
  campaignId: z.string().uuid(),
  linkedinAccountId: z.string().uuid(),
  leads: z.array(
    z.object({
      campaignLeadId: z.string().uuid(),
      leadId: z.string().uuid(),
    })
  ).min(1),
  sequence: z.array(SequenceStepSchema).min(1),
});

type CampaignScheduleInput = z.infer<typeof CampaignScheduleSchema>;

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/campaigns/schedule
 * Accepts campaign + leads + sequence steps, enqueues all jobs via BullMQ.
 *
 * Each lead gets the first non-wait step enqueued immediately.
 * Wait steps translate to delayed jobs.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const input: CampaignScheduleInput = CampaignScheduleSchema.parse(body);

    const jobIds: string[] = [];
    let cumulativeDelayMs = 0;

    for (const lead of input.leads) {
      cumulativeDelayMs = 0;

      for (const step of input.sequence) {
        if (step.actionType === "wait") {
          cumulativeDelayMs += step.waitDays * MILLISECONDS_PER_DAY;
          continue;
        }

        const jobData: CampaignStepJob = {
          type: "campaign-step",
          campaignId: input.campaignId,
          campaignLeadId: lead.campaignLeadId,
          leadId: lead.leadId,
          linkedinAccountId: input.linkedinAccountId,
          stepOrder: step.stepOrder,
          actionType: step.actionType,
          messageTemplate: step.messageTemplate ?? null,
        };

        const jobId = await enqueueCampaignStep(
          jobData,
          cumulativeDelayMs > 0 ? cumulativeDelayMs : undefined
        );
        jobIds.push(jobId);
      }
    }

    return NextResponse.json(
      {
        message: `Scheduled ${jobIds.length} jobs for ${input.leads.length} leads`,
        jobCount: jobIds.length,
        leadCount: input.leads.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const fieldErrors = error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Campaign Schedule API]", errorMessage);

    return NextResponse.json(
      { error: "Failed to schedule campaign" },
      { status: 500 }
    );
  }
}
