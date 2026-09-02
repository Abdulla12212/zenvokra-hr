import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { AdminStateContext } from './admin-context';
import { seedApprovals, seedEmployees } from './data/seed';
import type { CreateEmployeeInput, Employee } from './types';

export function AdminStateProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [approvals, setApprovals] = useState(seedApprovals);
  const employeesRef = useRef(employees);
  employeesRef.current = employees;

  const addEmployee = useCallback((input: CreateEmployeeInput) => {
    const created: Employee = {
      id: crypto.randomUUID(),
      employeeId: nextEmployeeId(employeesRef.current),
      fullName: input.fullName.trim(),
      workEmail: input.workEmail.trim().toLowerCase(),
      phone: input.phone.trim(),
      department: input.department,
      jobTitle: input.jobTitle.trim(),
      location: input.location,
      startDate: input.startDate,
      status: input.status,
      employmentType: 'full-time',
    };

    setEmployees((current) => [created, ...current]);
    return created;
  }, []);

  const decideApproval = useCallback((id: string, _decision: 'approved' | 'rejected') => {
    setApprovals((current) => current.filter((approval) => approval.id !== id));
  }, []);

  const value = useMemo(
    () => ({ employees, approvals, addEmployee, decideApproval }),
    [employees, approvals, addEmployee, decideApproval],
  );

  return <AdminStateContext.Provider value={value}>{children}</AdminStateContext.Provider>;
}

function nextEmployeeId(employees: Employee[]): string {
  const maxCode = employees.reduce((highest, employee) => {
    const numeric = Number(employee.employeeId.replace('EMP-', ''));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);

  return `EMP-${String(maxCode + 1).padStart(4, '0')}`;
}
