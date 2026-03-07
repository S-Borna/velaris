// Copyright (c) Said Borna. All rights reserved.
// Velaris — Lead Enrichment via People Data Labs API

import { z } from "zod";

/* ─── Constants ─────────────────────────────────────── */

const PDL_BASE_URL = "https://api.peopledatalabs.com/v5";
const PDL_PERSON_ENRICH_PATH = "/person/enrich";
const PDL_PERSON_SEARCH_PATH = "/person/search";
const REQUEST_TIMEOUT_MS = 15000;

/* ─── Schemas ───────────────────────────────────────── */

export const EnrichByLinkedinSchema = z.object({
  linkedinUrl: z.string().url("Valid LinkedIn URL required"),
});

export const EnrichByEmailSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const EnrichByNameSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
});

export const LeadSearchSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters"),
  size: z.number().min(1).max(100).default(10),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
});

export type EnrichByLinkedin = z.infer<typeof EnrichByLinkedinSchema>;
export type EnrichByEmail = z.infer<typeof EnrichByEmailSchema>;
export type EnrichByName = z.infer<typeof EnrichByNameSchema>;
export type LeadSearchInput = z.infer<typeof LeadSearchSchema>;

/* ─── Response Types ────────────────────────────────── */

export interface EnrichedLead {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  title: string | null;
  company: string | null;
  companySize: string | null;
  industry: string | null;
  location: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  experience: WorkExperience[];
  education: EducationEntry[];
  skills: string[];
}

export interface WorkExperience {
  title: string | null;
  company: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export interface EducationEntry {
  school: string | null;
  degree: string | null;
  field: string | null;
}

export interface EnrichmentResult {
  lead: EnrichedLead;
  confidence: number;
  source: string;
}

export interface SearchResult {
  leads: EnrichedLead[];
  total: number;
}

/* ─── PDL Response Mapping ──────────────────────────── */

interface PdlPersonResponse {
  status?: number;
  data?: PdlPerson;
  likelihood?: number;
  // Search results
  total?: number;
}

interface PdlPerson {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  job_title?: string | null;
  job_company_name?: string | null;
  job_company_size?: string | null;
  industry?: string | null;
  location_name?: string | null;
  headline?: string | null;
  linkedin_url?: string | null;
  work_email?: string | null;
  personal_emails?: string[];
  phone_numbers?: string[];
  profile_pic_url?: string | null;
  experience?: PdlExperience[];
  education?: PdlEducation[];
  skills?: string[];
}

interface PdlExperience {
  title?: { name?: string | null } | null;
  company?: { name?: string | null } | null;
  start_date?: string | null;
  end_date?: string | null;
  is_primary?: boolean;
}

interface PdlEducation {
  school?: { name?: string | null } | null;
  degrees?: string[];
  majors?: string[];
}

/**
 * Map a PDL person response to our EnrichedLead type.
 */
function mapPdlPerson(person: PdlPerson): EnrichedLead {
  return {
    id: person.id ?? crypto.randomUUID(),
    firstName: person.first_name ?? null,
    lastName: person.last_name ?? null,
    fullName: person.full_name ?? null,
    title: person.job_title ?? null,
    company: person.job_company_name ?? null,
    companySize: person.job_company_size ?? null,
    industry: person.industry ?? null,
    location: typeof person.location_name === "string" ? person.location_name : null,
    headline: person.headline ?? null,
    linkedinUrl: person.linkedin_url ?? null,
    email: typeof person.work_email === "string" ? person.work_email : person.personal_emails?.[0] ?? null,
    phone: person.phone_numbers?.[0] ?? null,
    avatarUrl: person.profile_pic_url ?? null,
    experience: (person.experience ?? []).map((exp) => ({
      title: exp.title?.name ?? null,
      company: exp.company?.name ?? null,
      startDate: exp.start_date ?? null,
      endDate: exp.end_date ?? null,
      isCurrent: exp.is_primary ?? false,
    })),
    education: (person.education ?? []).map((edu) => ({
      school: edu.school?.name ?? null,
      degree: edu.degrees?.[0] ?? null,
      field: edu.majors?.[0] ?? null,
    })),
    skills: person.skills ?? [],
  };
}

/* ─── API Client ────────────────────────────────────── */

/**
 * Make an authenticated request to People Data Labs API.
 */
async function pdlRequest(
  path: string,
  params: Record<string, string>
): Promise<PdlPersonResponse> {
  const apiKey = process.env.PDL_API_KEY;
  if (!apiKey) {
    throw new Error("PDL_API_KEY environment variable is not set");
  }

  const url = new URL(`${PDL_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `PDL API error (${response.status}): ${errorBody.slice(0, 200)}`
      );
    }

    return (await response.json()) as PdlPersonResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make a POST request to PDL search endpoint.
 */
async function pdlSearchRequest(
  path: string,
  body: Record<string, unknown>
): Promise<PdlPerson[]> {
  const apiKey = process.env.PDL_API_KEY;
  if (!apiKey) {
    throw new Error("PDL_API_KEY environment variable is not set");
  }

  const url = `${PDL_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `PDL Search API error (${response.status}): ${errorBody.slice(0, 200)}`
      );
    }

    const result = (await response.json()) as { data?: PdlPerson[]; total?: number };
    return result.data ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/* ─── Public API ────────────────────────────────────── */

/**
 * Enrich a lead by their LinkedIn URL.
 */
export async function enrichByLinkedin(
  input: EnrichByLinkedin
): Promise<EnrichmentResult> {
  const data = await pdlRequest(PDL_PERSON_ENRICH_PATH, {
    profile: input.linkedinUrl,
  });

  if (!data.data) {
    throw new Error("No person data returned from PDL");
  }

  return {
    lead: mapPdlPerson(data.data),
    confidence: data.likelihood ?? 0,
    source: "pdl-linkedin",
  };
}

/**
 * Enrich a lead by their email address.
 */
export async function enrichByEmail(
  input: EnrichByEmail
): Promise<EnrichmentResult> {
  const data = await pdlRequest(PDL_PERSON_ENRICH_PATH, {
    email: input.email,
  });

  if (!data.data) {
    throw new Error("No person data returned from PDL");
  }

  return {
    lead: mapPdlPerson(data.data),
    confidence: data.likelihood ?? 0,
    source: "pdl-email",
  };
}

/**
 * Enrich a lead by name + company.
 */
export async function enrichByName(
  input: EnrichByName
): Promise<EnrichmentResult> {
  const params: Record<string, string> = {
    first_name: input.firstName,
    last_name: input.lastName,
  };
  if (input.company) params.company = input.company;
  if (input.location) params.location = input.location;

  const data = await pdlRequest(PDL_PERSON_ENRICH_PATH, params);

  if (!data.data) {
    throw new Error("No person data returned from PDL");
  }

  return {
    lead: mapPdlPerson(data.data),
    confidence: data.likelihood ?? 0,
    source: "pdl-name",
  };
}

/**
 * Search for leads using PDL's person search API.
 * Builds an Elasticsearch query from the input parameters.
 */
export async function searchLeads(
  input: LeadSearchInput
): Promise<SearchResult> {
  const mustClauses: Record<string, unknown>[] = [];

  if (input.jobTitle) {
    mustClauses.push({ match: { job_title: input.jobTitle } });
  }
  if (input.companyName) {
    mustClauses.push({ match: { job_company_name: input.companyName } });
  }
  if (input.location) {
    mustClauses.push({ match: { location_name: input.location } });
  }
  if (input.industry) {
    mustClauses.push({ match: { industry: input.industry } });
  }

  // If no specific fields, use a multi-match on the query string
  if (mustClauses.length === 0) {
    mustClauses.push({
      multi_match: {
        query: input.query,
        fields: [
          "job_title",
          "job_company_name",
          "location_name",
          "industry",
          "full_name",
        ],
      },
    });
  }

  const esQuery = {
    query: {
      bool: {
        must: mustClauses,
      },
    },
  };

  const persons = await pdlSearchRequest(PDL_PERSON_SEARCH_PATH, {
    query: esQuery,
    size: input.size,
  });

  return {
    leads: persons.map(mapPdlPerson),
    total: persons.length,
  };
}
