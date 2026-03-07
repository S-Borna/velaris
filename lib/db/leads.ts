// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import {
  type PaginatedResult,
  type PaginationParams,
  getPaginationValues,
  buildPaginatedResult,
} from "@/lib/db/types";

// ─── Types ──────────────────────────────────────────────

/** Lead with full fields. */
export type LeadRecord = Prisma.LeadGetPayload<Record<string, never>>;

/** Filters for lead list queries. */
export interface LeadFilters {
  search?: string;
  source?: string;
  enrichmentStatus?: string;
  tags?: string[];
  company?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  icpScoreMin?: number;
  icpScoreMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Input for creating a lead. */
export interface CreateLeadInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  location?: string;
  headline?: string;
  avatarUrl?: string;
  tags?: string[];
  source?: string;
}

/** Input for updating a lead. */
export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  location?: string;
  headline?: string;
  avatarUrl?: string;
  tags?: string[];
  icpScore?: number;
  enrichmentStatus?: string;
}

// ─── Queries ────────────────────────────────────────────

/**
 * List leads for a workspace with filters and pagination.
 */
export async function listLeads(
  workspaceId: string,
  filters: LeadFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LeadRecord>> {
  const { skip, take, page, pageSize } = getPaginationValues(pagination);

  const where: Prisma.LeadWhereInput = {
    workspaceId,
    ...(filters.search && {
      OR: [
        { fullName: { contains: filters.search, mode: "insensitive" as const } },
        { firstName: { contains: filters.search, mode: "insensitive" as const } },
        { lastName: { contains: filters.search, mode: "insensitive" as const } },
        { title: { contains: filters.search, mode: "insensitive" as const } },
        { company: { contains: filters.search, mode: "insensitive" as const } },
        { location: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
    ...(filters.source && { source: filters.source }),
    ...(filters.enrichmentStatus && { enrichmentStatus: filters.enrichmentStatus }),
    ...(filters.company && {
      company: { contains: filters.company, mode: "insensitive" as const },
    }),
    ...(filters.industry && {
      industry: { contains: filters.industry, mode: "insensitive" as const },
    }),
    ...(filters.location && {
      location: { contains: filters.location, mode: "insensitive" as const },
    }),
    ...(filters.companySize && { companySize: filters.companySize }),
    ...((filters.icpScoreMin !== undefined || filters.icpScoreMax !== undefined) && {
      icpScore: {
        ...(filters.icpScoreMin !== undefined && { gte: filters.icpScoreMin }),
        ...(filters.icpScoreMax !== undefined && { lte: filters.icpScoreMax }),
      },
    }),
    ...(filters.tags && filters.tags.length > 0 && {
      tags: { hasSome: filters.tags },
    }),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput = filters.sortBy
    ? { [filters.sortBy]: filters.sortOrder ?? "desc" }
    : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy, skip, take }),
    prisma.lead.count({ where }),
  ]);

  return buildPaginatedResult(data, total, page, pageSize);
}

/**
 * Get a single lead by ID, scoped to workspace.
 */
export async function getLeadById(
  workspaceId: string,
  leadId: string,
): Promise<LeadRecord | null> {
  return prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });
}

/**
 * Create a single lead in a workspace.
 */
export async function createLead(
  workspaceId: string,
  input: CreateLeadInput,
): Promise<LeadRecord> {
  const fullName = input.fullName ??
    ([input.firstName, input.lastName].filter(Boolean).join(" ") || null);

  return prisma.lead.create({
    data: {
      workspaceId,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      fullName,
      linkedinUrl: input.linkedinUrl ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      title: input.title ?? null,
      company: input.company ?? null,
      companySize: input.companySize ?? null,
      industry: input.industry ?? null,
      location: input.location ?? null,
      headline: input.headline ?? null,
      avatarUrl: input.avatarUrl ?? null,
      tags: input.tags ?? [],
      source: input.source ?? null,
    },
  });
}

/**
 * Bulk create leads from CSV import or extraction.
 * Returns count of created leads.
 */
export async function bulkCreateLeads(
  workspaceId: string,
  leads: CreateLeadInput[],
): Promise<number> {
  const data = leads.map((input) => ({
    workspaceId,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    fullName:
      input.fullName ??
      ([input.firstName, input.lastName].filter(Boolean).join(" ") || null),
    linkedinUrl: input.linkedinUrl ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    title: input.title ?? null,
    company: input.company ?? null,
    companySize: input.companySize ?? null,
    industry: input.industry ?? null,
    location: input.location ?? null,
    headline: input.headline ?? null,
    avatarUrl: input.avatarUrl ?? null,
    tags: input.tags ?? [],
    source: input.source ?? null,
  }));

  const result = await prisma.lead.createMany({ data, skipDuplicates: true });
  return result.count;
}

/**
 * Update a lead. Fields not provided are left unchanged.
 */
export async function updateLead(
  workspaceId: string,
  leadId: string,
  input: UpdateLeadInput,
): Promise<LeadRecord | null> {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!existing) return null;

  return prisma.lead.update({
    where: { id: leadId },
    data: input,
  });
}

/**
 * Delete a lead.
 */
export async function deleteLead(
  workspaceId: string,
  leadId: string,
): Promise<boolean> {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!existing) return false;

  await prisma.lead.delete({ where: { id: leadId } });
  return true;
}

/**
 * Update ICP score for a lead.
 */
export async function updateLeadIcpScore(
  workspaceId: string,
  leadId: string,
  icpScore: number,
): Promise<LeadRecord | null> {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!existing) return null;

  return prisma.lead.update({
    where: { id: leadId },
    data: { icpScore },
  });
}

/**
 * Batch update ICP scores for multiple leads.
 */
export async function batchUpdateIcpScores(
  workspaceId: string,
  scores: Array<{ leadId: string; icpScore: number }>,
): Promise<number> {
  const operations = scores.map(({ leadId, icpScore }) =>
    prisma.lead.updateMany({
      where: { id: leadId, workspaceId },
      data: { icpScore },
    }),
  );

  const results = await prisma.$transaction(operations);
  return results.reduce((sum, r) => sum + r.count, 0);
}

/**
 * Get total lead count for a workspace.
 */
export async function getLeadCount(workspaceId: string): Promise<number> {
  return prisma.lead.count({ where: { workspaceId } });
}
