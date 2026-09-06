import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import {
  createEmployee,
  getCurrentEmployee,
  getEmployee,
  getEmployeeAttendance,
  getEmployeeLeave,
  listEmployees,
  updateEmployee,
  type CreateEmployeeInput,
  type Employee,
  type EmployeeCalendarCell,
  type EmployeeDetail,
  type EmployeeLeave,
  type ListEmployeesParams,
  type UpdateEmployeeInput,
} from './employees-api';

export const employeeKeys = {
  all: ['employees'] as const,
  current: () => [...employeeKeys.all, 'current'] as const,
  list: (params: ListEmployeesParams) => [...employeeKeys.all, 'list', params] as const,
  detail: (employeeId: string) => [...employeeKeys.all, 'detail', employeeId] as const,
  leave: (employeeId: string) => [...employeeKeys.all, 'leave', employeeId] as const,
  attendance: (employeeId: string, month: string, day: number) =>
    [...employeeKeys.all, 'attendance', employeeId, month, day] as const,
};

export function useCurrentEmployee() {
  return useQuery<Employee, ApiError>({
    queryKey: employeeKeys.current(),
    queryFn: ({ signal }) => getCurrentEmployee(signal),
  });
}

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => listEmployees(params, signal),
  });
}

export function useEmployee(employeeId: string) {
  return useQuery<EmployeeDetail, ApiError>({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: ({ signal }) => getEmployee(employeeId, signal),
    enabled: employeeId.length > 0,
  });
}

export function useEmployeeLeave(employeeId: string) {
  return useQuery<EmployeeLeave, ApiError>({
    queryKey: employeeKeys.leave(employeeId),
    queryFn: ({ signal }) => getEmployeeLeave(employeeId, signal),
    enabled: employeeId.length > 0,
  });
}

export function useEmployeeAttendance(employeeId: string, month: string, day: number) {
  return useQuery<EmployeeCalendarCell[], ApiError>({
    queryKey: employeeKeys.attendance(employeeId, month, day),
    queryFn: ({ signal }) => getEmployeeAttendance(employeeId, month, day, signal),
    enabled: employeeId.length > 0,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(employeeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
