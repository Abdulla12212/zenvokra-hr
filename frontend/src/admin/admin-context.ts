import { createContext } from 'react';

import type { Approval, CreateEmployeeInput, Employee } from './types';

export interface AdminState {
  employees: Employee[];
  approvals: Approval[];
  addEmployee: (input: CreateEmployeeInput) => Employee;
  decideApproval: (id: string, decision: 'approved' | 'rejected') => void;
}

export const AdminStateContext = createContext<AdminState | null>(null);
