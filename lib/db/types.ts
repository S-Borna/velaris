// Copyright (c) Said Borna. All rights reserved.

/**
 * Standard paginated response shape used across all service list functions.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Standard pagination input params.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** Default page size for list queries. */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Calculate skip/take from pagination params.
 */
export function getPaginationValues(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

/**
 * Build a PaginatedResult from data + total count.
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
