/**
 * The demo is one hardcoded tenant (Acme Consulting) and two personas for Akram.
 *
 * `GET /api/employees/me` is the employee-app persona. Admin lists the roster for
 * the same tenant. Do not add a tenant picker or invent login.
 *
 * The clock is frozen so both shells match the UX kits. Do not substitute `new Date()`.
 */
export const demoSession = {
  tenantName: 'Acme Consulting',
  location: 'Dhaka HQ',
  campusLabel: 'Dhaka HQ Campus · Floor 4',
  adminClockLabel: 'Thu 20 Aug 2026 · 09:42 AM · Asia/Dhaka HQ',
  employee: {
    fullName: 'Akram Hossain',
    employeeNumber: 'EMP-1024',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    workEmail: 'akram.hossain@acmeconsulting.test',
    managerName: 'Nadia Chowdhury',
    startedOnLabel: '12 Jan 2024',
    hoursLabel: '09:00–18:00',
    workingDaysLabel: 'Mon–Fri',
    timeZone: 'Asia/Dhaka',
    emergencyContact: 'Farah Hossain',
    employmentType: 'Full-time',
  },
  clockLabel: 'Thu 20 Aug 2026',
  inboxUnreadCount: 2,
} as const;
