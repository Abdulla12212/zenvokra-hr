import { api } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 *
 * This file is the only place that knows the shape of the departments endpoints. Types
 * are declared by hand to match the server's response records — see
 * docs/ARCHITECTURE.md for the plan to generate them from the OpenAPI document instead.
 */

export interface Department {
  id: string;
  name: string;
  createdAtUtc: string;
}

export interface ListDepartmentsParams {
  page?: number;
  pageSize?: number;
}

export interface CreateDepartmentInput {
  name: string;
}

const basePath = '/api/departments';

export function listDepartments(
  params: ListDepartmentsParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<Department>> {
  return api.get<PagedResult<Department>>(basePath, {
    query: { page: params.page, pageSize: params.pageSize },
    signal,
  });
}

export function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  return api.post<Department>(basePath, input);
}
