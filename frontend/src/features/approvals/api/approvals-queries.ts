import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import {
  decideApproval,
  listApprovals,
  type ApprovalsResponse,
  type DecideApprovalInput,
} from './approvals-api';

export const approvalKeys = {
  all: ['approvals'] as const,
  list: () => [...approvalKeys.all, 'list'] as const,
};

export function useApprovals() {
  return useQuery<ApprovalsResponse, ApiError>({
    queryKey: approvalKeys.list(),
    queryFn: ({ signal }) => listApprovals(signal),
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { approvalId: string } & DecideApprovalInput) =>
      decideApproval(input.approvalId, {
        kind: input.kind,
        decision: input.decision,
        note: input.note,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}
