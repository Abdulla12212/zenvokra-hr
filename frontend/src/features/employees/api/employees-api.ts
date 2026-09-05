import { api } from '@/lib/api-client';

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

export function getCurrentEmployee(signal?: AbortSignal): Promise<Employee> {
  return api.get<Employee>('/api/employees/me', { signal });
}
