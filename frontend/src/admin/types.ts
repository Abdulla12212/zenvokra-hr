export type EmploymentStatus = 'active' | 'inactive';
export type EmploymentType = 'full-time' | 'part-time' | 'contract';

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  workEmail: string;
  phone: string;
  department: string;
  jobTitle: string;
  location: string;
  startDate: string;
  status: EmploymentStatus;
  employmentType: EmploymentType;
}

export interface CreateEmployeeInput {
  fullName: string;
  workEmail: string;
  phone: string;
  department: string;
  jobTitle: string;
  location: string;
  startDate: string;
  status: EmploymentStatus;
}

export type ApprovalKind = 'leave' | 'clock-in' | 'clock-out' | 'late' | 'wfh' | 'sick';

export interface Approval {
  id: string;
  kind: ApprovalKind;
  employeeId: string;
  employeeName: string;
  department: string;
  details: string;
  submittedLabel: string;
  waiting: string;
}

export interface AttendanceRow {
  id: string;
  employeeName: string;
  clockIn: string;
  clockOut: string;
  status: 'present' | 'late' | 'wfh' | 'sick';
}

export interface LeaveDay {
  key: string;
  label: string;
  dateLabel: string;
  isToday: boolean;
  people: string[];
}
