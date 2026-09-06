import { demoSession } from '@/lib/demo-session';
import type { PagedResult } from '@/lib/paged-result';

import type { ApprovalItem, ApprovalsResponse } from '@/features/approvals/api/approvals-api';
import type { Dashboard } from '@/features/dashboard/api/dashboard-api';
import type { Employee, EmployeeDetail, EmployeeLeave } from '@/features/employees/api/employees-api';
import type { OrganizationProfile } from '@/features/organization/api/organization-api';

const akram: EmployeeDetail = {
  id: 'emp-1024',
  fullName: demoSession.employee.fullName,
  employeeNumber: demoSession.employee.employeeNumber,
  workEmail: demoSession.employee.workEmail,
  title: demoSession.employee.title,
  departmentName: demoSession.employee.department,
  location: demoSession.location,
  managerName: demoSession.employee.managerName,
  startedOn: '2024-01-12',
  hoursLabel: demoSession.employee.hoursLabel,
  workingDaysLabel: demoSession.employee.workingDaysLabel,
  timeZone: demoSession.employee.timeZone,
  emergencyContact: demoSession.employee.emergencyContact,
  employmentType: demoSession.employee.employmentType,
  phone: '+880 1711-102400',
  teamName: 'Platform Team',
  deskLabel: 'Floor 4, Desk 4B-12',
  status: 'Active',
  isAdmin: true,
};

const nadiaLeave: ApprovalItem = {
  id: 'leave-nadia',
  kind: 'leave',
  status: 'pending',
  employeeId: 'emp-1001',
  employeeName: 'Nadia Chowdhury',
  employeeNumber: 'EMP-1001',
  title: 'VP of Engineering',
  location: 'Dhaka HQ',
  summary: 'Annual leave · 2 days',
  detail: '25–26 Aug',
  note: 'Family visit.',
  managerVerified: true,
  recordedLabel: '',
  requestedLabel: '',
  sentLabel: 'Submitted today at 09:10 AM',
  sentAtUtc: '2026-08-20T03:10:00+00:00',
  decidedAtUtc: null,
};

function page<T>(items: T[]): PagedResult<T> {
  return {
    items,
    page: 1,
    pageSize: 100,
    totalCount: items.length,
    totalPages: 1,
    hasNextPage: false,
  };
}

export const currentEmployee: Employee = akram;

export const dashboardMock: Dashboard = {
  headcount: 1,
  present: 1,
  remote: 0,
  pendingApprovals: 1,
  pendingPunches: 0,
  pendingLeaves: 1,
  lateToday: 0,
  averageLatenessLabel: '—',
  onLeave: 0,
  annualOnLeave: 0,
  sickOnLeave: 0,
  activity: [
    {
      employeeId: akram.id,
      fullName: akram.fullName,
      employeeNumber: akram.employeeNumber,
      title: akram.title,
      timeLabel: '09:02 AM',
      detail: 'On-time',
      direction: 'In',
    },
  ],
};

export const approvalsMock: ApprovalsResponse = {
  pending: [nadiaLeave],
  resolved: [],
  pendingPunches: 0,
  pendingLeaves: 1,
};

export const organizationMock: OrganizationProfile = {
  id: 'org-1',
  displayName: 'Acme Consulting',
  workEmail: 'hr@acmeconsulting.test',
  supportHotline: '+880 2-55000000',
  officeLandline: '+880 2-55000001',
  websiteUrl: 'https://acmeconsulting.test',
  industry: 'Professional services',
  fiscalYear: 'July – June',
  workingDays: 'Mon,Tue,Wed,Thu,Fri',
  shiftTiming: '09:00 AM – 06:00 PM (1h lunch)',
  officeFloors: 'Level 4, Level 5',
  legalName: 'Acme Consulting Ltd.',
  clientCode: 'ACME-BD-2024',
  subscriptionTier: 'Enterprise Dedicated',
  contractPeriod: '15 Jan 2024 – 14 Jan 2027',
  seatLimit: 100,
  activeSeats: 1,
  regionTimeZone: 'Asia/Dhaka',
  supportSla: 'Business hours · 8h response',
  registeredOffice: 'Dhaka HQ, Floors 4 & 5',
};

export const employeesApiMock = {
  getCurrentEmployee: () => Promise.resolve(currentEmployee),
  listEmployees: () => Promise.resolve(page([akram])),
  getEmployee: () => Promise.resolve(akram),
  createEmployee: (input: { fullName: string; employeeNumber: string }) =>
    Promise.resolve({ ...akram, fullName: input.fullName, employeeNumber: input.employeeNumber, id: 'emp-new' }),
  updateEmployee: () => Promise.resolve(akram),
  getEmployeeLeave: (): Promise<EmployeeLeave> =>
    Promise.resolve({
      balances: [{ type: 'Annual', remaining: 10, total: 20 }],
      requests: [],
    }),
  getEmployeeAttendance: () => Promise.resolve([]),
};

export const dashboardApiMock = {
  getDashboard: () => Promise.resolve(dashboardMock),
};

export const approvalsApiMock = {
  listApprovals: () => Promise.resolve(approvalsMock),
  decideApproval: () => Promise.resolve({ ...approvalsMock, pending: [], pendingLeaves: 0 }),
};

export const organizationApiMock = {
  getOrganization: () => Promise.resolve(organizationMock),
  updateOrganization: (input: { displayName: string }) =>
    Promise.resolve({ ...organizationMock, displayName: input.displayName }),
};
