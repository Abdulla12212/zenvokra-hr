import type { LucideIcon } from 'lucide-react';
import { Clock, Heart, Home, LogOut, Plane } from 'lucide-react';

import type { ApprovalKind } from '../types';

export type ApprovalFilter = 'all' | 'leave' | 'clock' | 'late';

interface KindMeta {
  label: string;
  icon: LucideIcon;
}

const kindMeta: Record<ApprovalKind, KindMeta> = {
  leave: { label: 'Leave', icon: Plane },
  'clock-in': { label: 'Clock-in missing', icon: Clock },
  'clock-out': { label: 'Clock-out correction', icon: LogOut },
  late: { label: 'Late arrival', icon: Clock },
  wfh: { label: 'Work from home', icon: Home },
  sick: { label: 'Sick leave', icon: Heart },
};

export function approvalKindMeta(kind: ApprovalKind): KindMeta {
  return kindMeta[kind];
}

export function matchesApprovalFilter(kind: ApprovalKind, filter: ApprovalFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'leave') {
    return kind === 'leave' || kind === 'wfh' || kind === 'sick';
  }

  if (filter === 'clock') {
    return kind === 'clock-in' || kind === 'clock-out';
  }

  return kind === 'late';
}
