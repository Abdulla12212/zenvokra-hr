import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

import {
  createEmployee,
  getCurrentEmployee,
  listEmployees,
  updateEmployee,
  type CreateEmployeeInput,
  type Employee,
  type ListEmployeesParams,
  type UpdateEmployeeInput,
} from './employees-api';

export const employeeKeys = {
  all: ['employees'] as const,
  current: () => [...employeeKeys.all, 'current'] as const,
  list: (params: ListEmployeesParams) => [...employeeKeys.all, 'list', params] as const,
};

export function useCurrentEmployee() {
  return useQuery<Employee, ApiError>({
    queryKey: employeeKeys.current(),
    queryFn: ({ signal }) => getCurrentEmployee(signal),
  });
}

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery<PagedResult<Employee>, ApiError>({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => listEmployees(params, signal),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, CreateEmployeeInput>({
    mutationFn: (input) => createEmployee(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, UpdateEmployeeInput>({
    mutationFn: (input) => updateEmployee(employeeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
