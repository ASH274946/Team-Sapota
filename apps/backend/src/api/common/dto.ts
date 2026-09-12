export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CursorPaginationDto {
  cursor: string | null;
  limit: number;
  hasMore: boolean;
}

export interface SortDto {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterDto {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

export interface DateRangeDto {
  start?: string;
  end?: string;
}

export interface ApiListQueryDto {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
  dateFrom?: string;
  dateTo?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  pagination?: PaginationDto;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  fields?: Record<string, string[]>;
  requestId: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface JobStatusDto {
  jobId: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
  estimatedCompletion?: string;
}

export interface IdResponseDto {
  id: string;
}
