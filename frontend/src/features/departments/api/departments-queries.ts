import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

import {
  createDepartment,
  listDepartments,
  type CreateDepartmentInput,
  type Department,
  type ListDepartmentsParams,
} from './departments-api';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 */

/**
 * Every cache key for this feature, built from one place.
 *
 * Hand-written key arrays scattered across components drift, and then invalidation
 * silently stops matching. `all` is the prefix that invalidates everything the feature
 * has cached.
 */
export const departmentKeys = {
  all: ['departments'] as const,
  list: (params: ListDepartmentsParams) => [...departmentKeys.all, 'list', params] as const,
};

export function useDepartments(params: ListDepartmentsParams = {}) {
  return useQuery<PagedResult<Department>, ApiError>({
    queryKey: departmentKeys.list(params),
    queryFn: ({ signal }) => listDepartments(params, signal),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation<Department, ApiError, CreateDepartmentInput>({
    // Wrapped rather than passed by reference: TanStack Query calls `mutationFn` with
    // `(variables, context)`, and forwarding that second argument into an API function
    // would silently bind it to whatever optional parameter is added there next.
    mutationFn: (input) => createDepartment(input),
    onSuccess: async () => {
      // Invalidate rather than write into the cache by hand: the server decides sort
      // order and paging, and guessing where a new row lands gets it wrong.
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}
