// Standard API response wrapper
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Permission roles for folders and files
export type PermissionRole = "OWNER" | "EDITOR" | "VIEWER";

// Pagination parameters
export interface IPaginationParams {
  page?: number;
  limit?: number;
}

// Pagination metadata
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated response
export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

// Srot types
export type SortOrder = "asc" | "desc";

// Sort parameters
export interface ISortParams<T extends string = string> {
  sortBy?: T;
  sortOrder?: SortOrder;
}

// Search parameters
export interface ISearchParams {
  search?: string;
  query?: string;
}

// Date range filter
export interface IDateRangeFilter {
  dateFrom?: Date | string;
  dateTo?: Date | string;
}
