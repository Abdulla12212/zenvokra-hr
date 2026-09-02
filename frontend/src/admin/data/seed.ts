import type { Approval, AttendanceRow, Employee, LeaveDay } from '../types';

export const companyName = 'Acme Ltd';
export const dashboardDateLabel = '2 Sep 2026';
export const weekHours = 812;

export const departments = [
  'Engineering',
  'Operations',
  'Design',
  'Finance',
  'Human Resources',
  'Marketing',
  'Sales',
  'People',
] as const;

export const locations = [
  'Dhaka, Bangladesh',
  'Lahore, Pakistan',
  'Karachi, Pakistan',
  'Chattogram, Bangladesh',
  'Islamabad, Pakistan',
] as const;

export const seedEmployees: Employee[] = [
  emp('1', '1001', 'Sara Alam', 'Engineering', 'Senior Frontend Engineer', 'Dhaka, Bangladesh', '2022-09-04'),
  emp('2', '1002', 'Mohsin Raza', 'Engineering', 'Backend Engineer', 'Lahore, Pakistan', '2021-09-02'),
  emp('3', '1003', 'Nadia Khan', 'Design', 'Product Designer', 'Karachi, Pakistan', '2022-07-01'),
  emp('4', '1004', 'Tariq Ahmed', 'Operations', 'Operations Manager', 'Dhaka, Bangladesh', '2020-09-01'),
  emp('5', '1005', 'Zara Fatima', 'Finance', 'Finance Executive', 'Islamabad, Pakistan', '2022-09-03'),
  emp('6', '1006', 'Ali Hassan', 'Human Resources', 'HR Generalist', 'Chattogram, Bangladesh', '2023-01-02'),
  emp('7', '1007', 'Shamim Akter', 'Marketing', 'Marketing Specialist', 'Dhaka, Bangladesh', '2021-08-15', 'inactive'),
  emp('8', '1008', 'Rafiq Wahid', 'Sales', 'Sales Executive', 'Lahore, Pakistan', '2022-10-05'),
  emp('9', '1009', 'Omar Farooq', 'Engineering', 'QA Engineer', 'Dhaka, Bangladesh', '2023-03-12'),
  emp('10', '1010', 'Ayesha Malik', 'People', 'People Partner', 'Karachi, Pakistan', '2021-11-08'),
  emp('11', '1011', 'Bilal Ahmed', 'Sales', 'Account Executive', 'Lahore, Pakistan', '2022-04-18'),
  emp('12', '1012', 'Hina Tariq', 'Marketing', 'Content Lead', 'Dhaka, Bangladesh', '2024-01-09'),
  emp('13', '1013', 'Yusuf Khan', 'Engineering', 'Software Engineer', 'Dhaka, Bangladesh', '2023-06-20'),
  emp('14', '1014', 'Farah Noor', 'Finance', 'Accountant', 'Islamabad, Pakistan', '2022-02-14'),
  emp('15', '1015', 'Imran Chowdhury', 'Operations', 'Operations Analyst', 'Chattogram, Bangladesh', '2024-05-03'),
  emp('16', '1016', 'Maya Rahman', 'Design', 'Product Designer', 'Dhaka, Bangladesh', '2023-09-11'),
];

export const seedApprovals: Approval[] = [
  {
    id: 'appr-1',
    kind: 'leave',
    employeeId: 'EMP-1001',
    employeeName: 'Sara Alam',
    department: 'Operations',
    details: 'Annual leave · 4 Sep 2026',
    submittedLabel: '31 Aug 2026 09:02',
    waiting: '2d',
  },
  {
    id: 'appr-2',
    kind: 'clock-in',
    employeeId: 'EMP-1002',
    employeeName: 'Mohsin Raza',
    department: 'Engineering',
    details: 'Missing clock-in · 2 Sep 2026',
    submittedLabel: '31 Aug 2026 08:55',
    waiting: '2d',
  },
  {
    id: 'appr-3',
    kind: 'late',
    employeeId: 'EMP-1003',
    employeeName: 'Nadia Khan',
    department: 'People',
    details: 'Late by 35m · 2 Sep 2026',
    submittedLabel: '31 Aug 2026 09:28',
    waiting: '2d',
  },
  {
    id: 'appr-4',
    kind: 'clock-out',
    employeeId: 'EMP-1004',
    employeeName: 'Tariq Ahmed',
    department: 'Engineering',
    details: 'Missing clock-out · 1 Sep 2026',
    submittedLabel: '31 Aug 2026 —',
    waiting: '2d',
  },
  {
    id: 'appr-5',
    kind: 'wfh',
    employeeId: 'EMP-1005',
    employeeName: 'Zara Fatima',
    department: 'Operations',
    details: 'Work from home · 3 Sep 2026',
    submittedLabel: '31 Aug 2026 —',
    waiting: '2d',
  },
  {
    id: 'appr-6',
    kind: 'late',
    employeeId: 'EMP-1006',
    employeeName: 'Ali Hassan',
    department: 'Operations',
    details: 'Late by 20m · 2 Sep 2026',
    submittedLabel: '31 Aug 2026 —',
    waiting: '2d',
  },
  {
    id: 'appr-7',
    kind: 'sick',
    employeeId: 'EMP-1001',
    employeeName: 'Sara Alam',
    department: 'Operations',
    details: 'Sick leave · 2–3 Sep 2026',
    submittedLabel: '31 Aug 2026 —',
    waiting: '2d',
  },
];

export const seedAttendanceToday: AttendanceRow[] = [
  { id: 'att-1', employeeName: 'Sara Alam', clockIn: '09:02', clockOut: '17:18', status: 'present' },
  { id: 'att-2', employeeName: 'Mohsin Raza', clockIn: '08:55', clockOut: '17:06', status: 'present' },
  { id: 'att-3', employeeName: 'Nadia Khan', clockIn: '09:28', clockOut: '—', status: 'late' },
  { id: 'att-4', employeeName: 'Tariq Ahmed', clockIn: '09:05', clockOut: '—', status: 'present' },
  { id: 'att-5', employeeName: 'Zara Fatima', clockIn: '—', clockOut: '—', status: 'wfh' },
  { id: 'att-6', employeeName: 'Ali Hassan', clockIn: '—', clockOut: '—', status: 'sick' },
];

export const seedLeaveThisWeek: LeaveDay[] = [
  { key: 'mon', label: 'Mon', dateLabel: '31 Aug', isToday: false, people: [] },
  { key: 'tue', label: 'Tue', dateLabel: '1 Sep', isToday: false, people: [] },
  { key: 'wed', label: 'Wed', dateLabel: '2 Sep', isToday: true, people: ['SA Sara Alam', 'TA Tariq Ahmed'] },
  { key: 'thu', label: 'Thu', dateLabel: '3 Sep', isToday: false, people: ['SA Sara Alam', 'TA Tariq Ahmed'] },
  { key: 'fri', label: 'Fri', dateLabel: '4 Sep', isToday: false, people: [] },
];

function emp(
  id: string,
  code: string,
  fullName: string,
  department: string,
  jobTitle: string,
  location: string,
  startDate: string,
  status: Employee['status'] = 'active',
): Employee {
  const localPart = fullName.toLowerCase().replaceAll(' ', '.');

  return {
    id: `emp-${id}`,
    employeeId: `EMP-${code}`,
    fullName,
    workEmail: `${localPart}@acme.com`,
    phone: '',
    department,
    jobTitle,
    location,
    startDate,
    status,
    employmentType: 'full-time',
  };
}
