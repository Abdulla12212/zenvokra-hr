import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminOpsKeys } from '@/lib/admin-ops-keys';
import type { ApiError } from '@/lib/api-client';

import {
  decideApproval,
  listApprovals,
  type Approvals,
  type DecideApprovalInput,
} from './approvals-api';

export const approvalKeys = {
  all: [...adminOpsKeys.all, 'approvals'] as const,
};

export function useApprovals() {
  return useQuery<Approvals, ApiError>({
    queryKey: approvalKeys.all,
    queryFn: ({ signal }) => listApprovals(signal),
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();

  return useMutation<Approvals, ApiError, { id: string } & DecideApprovalInput>({
    mutationFn: ({ id, ...input }) => decideApproval(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminOpsKeys.all });
    },
  });
}
