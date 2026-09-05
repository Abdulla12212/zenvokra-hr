/**
 * The employee app is a single-persona product. This is that person and company.
 *
 * Ticket 01 seeds the same row for the demo tenant. The shell and Profile extras
 * still read from here; `GET /api/employees/me` is the name / number / email.
 * Do not add a second employee, a People list, or a tenant picker.
 *
 * The clock is frozen so Home, punches, and leave match `docs/ux-employee`. Do not
 * substitute `new Date()`.
 */
export const demoSession = {
  tenantName: 'Acme Consulting',
  location: 'Dhaka HQ',
  campusLabel: 'Dhaka HQ Campus · Floor 4',
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
