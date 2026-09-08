import { api } from '@/lib/api-client';
import type { LeaveBalance, LeaveRequest } from '@/lib/employee-app-types';
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
}

export interface EmployeeDetail extends Employee {
  phone: string;
  teamName: string;
  deskLabel: string;
  status: string;
  isAdmin: boolean;
  leaveRemaining?: number;
  leaveBalances?: LeaveBalance[];
}

export interface ListEmployeesParams {
  search?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeInput {
  fullName: string;
  workEmail: string;
  employeeNumber: string;
  departmentName: string;
  title: string;
  location: string;
  phone: string;
  hoursLabel: string;
  managerName: string;
  startedOn?: string;
  teamName: string;
  deskLabel: string;
}

export interface UpdateEmployeeInput {
  fullName: string;
  workEmail: string;
  title: string;
  departmentName: string;
  location: string;
  managerName: string;
  phone: string;
  teamName: string;
  deskLabel: string;
  hoursLabel: string;
  status: string;
  startedOn?: string;
}

export interface EmployeeLeave {
  balances: LeaveBalance[];
  requests: LeaveRequest[];
}

export interface EmployeeCalendarCell {
  day: number | null;
  weekend: boolean;
  today: boolean;
  selected: boolean;
  inRange: boolean;
  kind: string;
  metaPrimary: string | null;
  metaSecondary: string | null;
  showPlane: boolean;
  clockIn: string | null;
  clockOut: string | null;
  hours: string | null;
  breakDuration: string | null;
  note: string | null;
}

const basePath = '/api/employees';

export function getCurrentEmployee(signal?: AbortSignal): Promise<Employee> {
  return api.get<Employee>(`${basePath}/me`, { signal });
}

export function listEmployees(
  params: ListEmployeesParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<EmployeeDetail>> {
  return api.get<PagedResult<EmployeeDetail>>(basePath, {
    query: {
      search: params.search,
      department: params.department,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}

export function getEmployee(employeeId: string, signal?: AbortSignal): Promise<EmployeeDetail> {
  return api.get<EmployeeDetail>(`${basePath}/${employeeId}`, { signal });
}

export function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDetail> {
  return api.post<EmployeeDetail>(basePath, input);
}

export function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeDetail> {
  return api.patch<EmployeeDetail>(`${basePath}/${employeeId}`, input);
}

export function getEmployeeLeave(employeeId: string, signal?: AbortSignal): Promise<EmployeeLeave> {
  return api.get<EmployeeLeave>(`${basePath}/${employeeId}/leave`, { signal });
}

export function getEmployeeAttendance(
  employeeId: string,
  month: string,
  day: number,
  signal?: AbortSignal,
): Promise<EmployeeCalendarCell[]> {
  return api.get<EmployeeCalendarCell[]>(`${basePath}/${employeeId}/attendance`, {
    query: { month, day },
    signal,
  });
}
