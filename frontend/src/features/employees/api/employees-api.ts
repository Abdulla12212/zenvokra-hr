import { api } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

export interface Employee {
  id: string;
  fullName: string;
  employeeNumber: string;
  workEmail: string;
  title: string;
  departmentName: string;
  location: string;
  managerName: string;
  startedOn: string;
  hoursLabel: string;
  workingDaysLabel: string;
  timeZone: string;
  emergencyContact: string;
  employmentType: string;
  phone: string;
  teamName: string;
  deskLabel: string;
  status: string;
}

export interface ListEmployeesParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeInput {
  fullName: string;
  workEmail: string;
  password: string;
  employeeNumber: string;
  departmentName: string;
  title: string;
  location: string;
  phone?: string;
  hoursLabel?: string;
  managerName?: string;
  startedOn?: string;
  teamName?: string;
  deskLabel?: string;
}

export interface UpdateEmployeeInput {
  fullName: string;
  workEmail: string;
  password?: string;
  title: string;
  departmentName: string;
  location: string;
  managerName?: string;
  phone?: string;
  teamName?: string;
  deskLabel?: string;
  hoursLabel?: string;
  status: string;
  startedOn?: string;
}

const basePath = '/api/employees';

export function getCurrentEmployee(signal?: AbortSignal): Promise<Employee> {
  return api.get<Employee>(`${basePath}/me`, { signal });
}

export function listEmployees(
  params: ListEmployeesParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<Employee>> {
  return api.get<PagedResult<Employee>>(basePath, {
    query: { search: params.search, page: params.page, pageSize: params.pageSize },
    signal,
  });
}

export function getEmployee(employeeId: string, signal?: AbortSignal): Promise<Employee> {
  return api.get<Employee>(`${basePath}/${employeeId}`, { signal });
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return api.post<Employee>(basePath, input);
}

export function updateEmployee(employeeId: string, input: UpdateEmployeeInput): Promise<Employee> {
  return api.patch<Employee>(`${basePath}/${employeeId}`, input);
}
