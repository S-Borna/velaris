// Copyright (c) Said Borna. All rights reserved.
import { prisma } from "./prisma";
import type { Lead, Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────

export interface LeadListParams {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  seniority?: string[];
  departments?: string[];
  locations?: string[];
  industries?: string[];
  companySizes?: string[];
  source?: string;
  minIcpScore?: number;
  maxIcpScore?: number;
  tags?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadCreateData {
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
  icpScore?: number;
  tags?: string[];
  source?: string;
  enrichmentStatus?: string;
}

export interface LeadUpdateData {
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
  icpScore?: number;
  tags?: string[];
  source?: string;
  enrichmentStatus?: string;
}

// ── Queries ──────────────────────────────────────────────

/**
 * List leads for a workspace with pagination, filtering, sorting.
 */
export async function listLeads(
  workspaceId: string,
  params: LeadListParams
): Promise<PaginatedResult<Lead>> {
  const {
    page,
    pageSize,
    search,
    sort,
    order,
    locations,
    industries,
    companySizes,
    source,
    minIcpScore,
    maxIcpScore,
  } = params;

  const where: Prisma.LeadWhereInput = {
    workspaceId,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(locations && locations.length > 0
      ? { location: { in: locations, mode: "insensitive" as const } }
      : {}),
    ...(industries && industries.length > 0
      ? { industry: { in: industries, mode: "insensitive" as const } }
      : {}),
    ...(companySizes && companySizes.length > 0
      ? { companySize: { in: companySizes } }
      : {}),
    ...(source ? { source } : {}),
    ...(minIcpScore !== undefined || maxIcpScore !== undefined
      ? {
          icpScore: {
            ...(minIcpScore !== undefined ? { gte: minIcpScore } : {}),
            ...(maxIcpScore !== undefined ? { lte: maxIcpScore } : {}),
          },
        }
      : {}),
  };

  const sortField = sort ?? "icpScore";
  const sortOrder = order ?? "desc";
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    sortField === "name"
      ? { fullName: sortOrder }
      : { [sortField]: sortOrder };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single lead by ID, scoped to workspace.
 */
export async function getLeadById(
  workspaceId: string,
  leadId: string
): Promise<Lead | null> {
  return prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });
}

/**
 * Create a single lead in a workspace.
 */
export async function createLead(
  workspaceId: string,
  data: LeadCreateData
): Promise<Lead> {
  return prisma.lead.create({
    data: {
      workspaceId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      linkedinUrl: data.linkedinUrl,
      email: data.email,
      phone: data.phone,
      title: data.title,
      company: data.company,
      companySize: data.companySize,
      industry: data.industry,
      location: data.location,
      headline: data.headline,
      avatarUrl: data.avatarUrl,
      icpScore: data.icpScore,
      tags: data.tags ?? [],
      source: data.source ?? "database",
      enrichmentStatus: data.enrichmentStatus ?? "pending",
    },
  });
}

/**
 * Bulk create leads from CSV import.
 */
export async function bulkCreateLeads(
  workspaceId: string,
  leads: LeadCreateData[]
): Promise<{ count: number }> {
  const result = await prisma.lead.createMany({
    data: leads.map((lead) => ({
      workspaceId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      fullName: lead.fullName ?? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim(),
      linkedinUrl: lead.linkedinUrl,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
      company: lead.company,
      companySize: lead.companySize,
      industry: lead.industry,
      location: lead.location,
      headline: lead.headline,
      avatarUrl: lead.avatarUrl,
      icpScore: lead.icpScore,
      tags: lead.tags ?? [],
      source: lead.source ?? "csv",
      enrichmentStatus: lead.enrichmentStatus ?? "pending",
    })),
    skipDuplicates: true,
  });

  return { count: result.count };
}

/**
 * Update a lead.
 */
export async function updateLead(
  workspaceId: string,
  leadId: string,
  data: LeadUpdateData
): Promise<Lead> {
  return prisma.lead.update({
    where: { id: leadId, workspaceId },
    data,
  });
}

/**
 * Delete a lead.
 */
export async function deleteLead(
  workspaceId: string,
  leadId: string
): Promise<Lead> {
  return prisma.lead.delete({
    where: { id: leadId, workspaceId },
  });
}
