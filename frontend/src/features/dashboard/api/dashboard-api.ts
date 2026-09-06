import { api } from '@/lib/api-client';

export interface DashboardPunchRow {
  employeeId: string;
  fullName: string;
  employeeNumber: string;
  title: string;
  timeLabel: string;
  detail: string;
  direction: string;
}

export interface Dashboard {
  headcount: number;
  present: number;
  remote: number;
  pendingApprovals: number;
  pendingPunches: number;
  pendingLeaves: number;
  lateToday: number;
  averageLatenessLabel: string;
  onLeave: number;
  annualOnLeave: number;
  sickOnLeave: number;
  activity: DashboardPunchRow[];
}

export function getDashboard(signal?: AbortSignal): Promise<Dashboard> {
  return api.get<Dashboard>('/api/dashboard', { signal });
}
