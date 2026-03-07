// Copyright (c) Said Borna. All rights reserved.
// Velaris — AI Content Generator (Claude API)

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/* ─── Constants ─────────────────────────────────────── */

const MODEL_ID = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.9;
const VARIANT_COUNT = 3;

/* ─── Schemas ───────────────────────────────────────── */

export const ContentInputSchema = z.object({
  category: z.string().min(1, "Category is required"),
  topic: z.string().min(1, "Topic is required"),
  audience: z.string().min(1, "Target audience is required"),
  language: z.string().min(1, "Language is required"),
  tone: z.enum([
    "professional",
    "casual",
    "inspirational",
    "educational",
    "controversial",
    "storytelling",
  ]),
  brandVoiceSamples: z.array(z.string()).optional(),
});

export type ContentInput = z.infer<typeof ContentInputSchema>;

export interface GeneratedVariant {
  id: string;
  variant: string;
  content: string;
  hookScore: number;
  predictedReach: string;
  hashtags: string[];
}

export interface ContentGenerationResult {
  variants: GeneratedVariant[];
  model: string;
  tokensUsed: number;
}

/* ─── Prompt Builder ────────────────────────────────── */

/**
 * Build the system prompt for LinkedIn content generation.
 * Includes brand voice samples if provided.
 */
function buildSystemPrompt(input: ContentInput): string {
  const brandVoiceSection =
    input.brandVoiceSamples &&
    input.brandVoiceSamples.filter((s) => s.trim()).length > 0
      ? `\n\nBRAND VOICE REFERENCE — Match this writing style closely:\n${input.brandVoiceSamples
          .filter((s) => s.trim())
          .map((s, i) => `--- Sample ${i + 1} ---\n${s}`)
          .join("\n\n")}`
      : "";

  return `You are an expert LinkedIn content strategist and copywriter. You create viral, engaging LinkedIn posts that drive impressions, engagement, and business results.

RULES:
- Write in ${input.language}
- Every post MUST start with a strong hook (first 2 lines are critical for feed visibility)
- Use line breaks generously — LinkedIn rewards scannable content
- Include a clear CTA at the end (question, repost prompt, or soft action)
- Do NOT use generic filler or corporate buzzwords
- Each variant should take a DIFFERENT angle on the same topic
- Posts should be 150-300 words (optimal LinkedIn length)
- Use emojis sparingly and only where they add clarity
- Never use more than 4 hashtags per post${brandVoiceSection}

RESPONSE FORMAT — You MUST respond with valid JSON only, no markdown fences, no extra text:
{
  "variants": [
    {
      "variant": "A",
      "content": "The full LinkedIn post text...",
      "hookScore": 85,
      "predictedReach": "10K-15K",
      "hashtags": ["#Tag1", "#Tag2"]
    }
  ]
}

HOOK SCORE CRITERIA (0-100):
- 90-100: Pattern interrupt, personal story, contrarian take, or data-backed claim
- 80-89: Strong curiosity gap, specific promise, or surprising stat
- 70-79: Decent opener with audience relevance but not remarkable
- Below 70: Generic or uninspiring opener

PREDICTED REACH: Estimate based on topic virality, hook strength, and audience size. Format as "XK-YK".`;
}

/**
 * Build the user prompt with specific content request details.
 */
function buildUserPrompt(input: ContentInput): string {
  return `Generate ${VARIANT_COUNT} LinkedIn post variants with the following parameters:

CATEGORY: ${input.category}
TOPIC: ${input.topic}
TARGET AUDIENCE: ${input.audience}
LANGUAGE: ${input.language}
TONE: ${input.tone}

Each variant should take a distinctly different angle:
- Variant A: The strongest hook, most viral potential
- Variant B: Personal storytelling angle
- Variant C: Data/insight-driven, educational approach

Remember: respond ONLY with valid JSON, no markdown code fences.`;
}

/* ─── Response Parser ───────────────────────────────── */

const VariantSchema = z.object({
  variant: z.string(),
  content: z.string(),
  hookScore: z.number().min(0).max(100),
  predictedReach: z.string(),
  hashtags: z.array(z.string()),
});

const ResponseSchema = z.object({
  variants: z.array(VariantSchema).min(1),
});

/**
 * Parse and validate Claude's JSON response into typed variants.
 * Strips markdown fences if present.
 */
function parseResponse(raw: string): GeneratedVariant[] {
  let cleaned = raw.trim();

  // Strip markdown code fences if Claude wraps the JSON
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed: unknown = JSON.parse(cleaned);
  const validated = ResponseSchema.parse(parsed);

  return validated.variants.map((v, i) => ({
    id: `gen-${Date.now()}-${i}`,
    variant: v.variant,
    content: v.content,
    hookScore: v.hookScore,
    predictedReach: v.predictedReach,
    hashtags: v.hashtags,
  }));
}

/* ─── Main Generator ────────────────────────────────── */

/**
 * Generate LinkedIn content using Claude API.
 * Returns 3 variants with hook scores, reach predictions, and hashtags.
 *
 * @throws Error if API key is missing, API call fails, or response parsing fails.
 */
export async function generateContent(
  input: ContentInput
): Promise<ContentGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text content from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const variants = parseResponse(textBlock.text);

  return {
    variants,
    model: MODEL_ID,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
