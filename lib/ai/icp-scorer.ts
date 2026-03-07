// Copyright (c) Said Borna. All rights reserved.
// Velaris — AI-powered ICP (Ideal Customer Profile) Scoring via Claude API

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/* ─── Constants ─────────────────────────────────────── */

const MODEL_ID = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const TEMPERATURE = 0.3;

/* ─── Schemas ───────────────────────────────────────── */

export const LeadProfileSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  companySize: z.string().optional(),
});

export type LeadProfile = z.infer<typeof LeadProfileSchema>;

export const IcpScoringInputSchema = z.object({
  icpDescription: z.string().min(10, "ICP description must be at least 10 characters"),
  minScore: z.number().min(0).max(100).default(70),
  leads: z.array(LeadProfileSchema).min(1).max(50),
});

export type IcpScoringInput = z.infer<typeof IcpScoringInputSchema>;

export interface LeadScore {
  leadId: string;
  score: number;
  reasoning: string;
  matchLevel: "high" | "medium" | "low";
}

export interface IcpScoringResult {
  scores: LeadScore[];
  model: string;
  tokensUsed: number;
}

/* ─── Prompt Builder ────────────────────────────────── */

/**
 * Build the system prompt for ICP scoring.
 */
function buildSystemPrompt(): string {
  return `You are an expert B2B lead qualification analyst. You score leads against an Ideal Customer Profile (ICP) description.

RULES:
- Score each lead 0-100 based on how well they match the ICP
- Consider: job title, company size, industry, location, seniority level
- Be precise and consistent across leads
- Provide a brief 1-sentence reasoning for each score

SCORE GUIDELINES:
- 90-100: Near-perfect ICP match — all key criteria align
- 70-89: Strong match — most criteria align, minor gaps
- 50-69: Partial match — some criteria match but significant gaps
- 30-49: Weak match — limited alignment with ICP
- 0-29: Poor match — does not fit ICP at all

MATCH LEVELS:
- "high" = score >= 80
- "medium" = score >= 50 and < 80
- "low" = score < 50

RESPONSE FORMAT — respond with valid JSON only, no markdown fences:
{
  "scores": [
    {
      "leadId": "the-lead-id",
      "score": 85,
      "reasoning": "Brief explanation of why this score",
      "matchLevel": "high"
    }
  ]
}`;
}

/**
 * Build user prompt with ICP description and lead profiles.
 */
function buildUserPrompt(input: IcpScoringInput): string {
  const leadsTable = input.leads
    .map((lead) => {
      const parts = [
        `ID: ${lead.id}`,
        lead.firstName || lead.lastName
          ? `Name: ${[lead.firstName, lead.lastName].filter(Boolean).join(" ")}`
          : null,
        lead.title ? `Title: ${lead.title}` : null,
        lead.company ? `Company: ${lead.company}` : null,
        lead.industry ? `Industry: ${lead.industry}` : null,
        lead.location ? `Location: ${lead.location}` : null,
        lead.headline ? `Headline: ${lead.headline}` : null,
        lead.companySize ? `Company Size: ${lead.companySize}` : null,
      ];
      return parts.filter(Boolean).join(" | ");
    })
    .join("\n");

  return `IDEAL CUSTOMER PROFILE:
${input.icpDescription}

MINIMUM SCORE THRESHOLD: ${input.minScore} (for reference only — still score all leads accurately)

LEADS TO SCORE:
${leadsTable}

Score each lead against the ICP. Respond with JSON only.`;
}

/* ─── Response Parser ───────────────────────────────── */

const ScoreSchema = z.object({
  leadId: z.string(),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  matchLevel: z.enum(["high", "medium", "low"]),
});

const ResponseSchema = z.object({
  scores: z.array(ScoreSchema).min(1),
});

/**
 * Parse and validate Claude's ICP scoring response.
 */
function parseResponse(raw: string): LeadScore[] {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed: unknown = JSON.parse(cleaned);
  const validated = ResponseSchema.parse(parsed);

  return validated.scores;
}

/* ─── Main Scorer ───────────────────────────────────── */

/**
 * Score leads against an ICP description using Claude API.
 * Processes up to 50 leads per call.
 *
 * @throws Error if API key is missing, API call fails, or response parsing fails.
 */
export async function scoreLeadsForIcp(
  input: IcpScoringInput
): Promise<IcpScoringResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const scores = parseResponse(textBlock.text);

  return {
    scores,
    model: MODEL_ID,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
