import { Request } from 'express';
import type { PaginationDto, ApiListQueryDto } from './dto';

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationDto;
}

export function parsePagination(req: Request): Required<Pick<ApiListQueryDto, 'page' | 'limit'>> & { sort: string; order: 'asc' | 'desc'; search: string } {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const sort = (req.query.sort as string) || 'createdAt';
  const order = (req.query.order as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc';
  const search = (req.query.search as string) || '';
  return { page, limit, sort, order, search };
}

export function parseCursorPagination(req: Request): { cursor: string | null; limit: number } {
  const cursor = (req.query.cursor as string) || null;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { cursor, limit };
}

export function buildPagination(page: number, limit: number, total: number): PaginationDto {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
