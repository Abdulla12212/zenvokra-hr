/**
 * Mirror of the server's `PagedResult<T>`. Every list endpoint returns this shape.
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
}
