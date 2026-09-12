import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import { getCurrentUser, login, logout, type LoginInput, type Session } from './auth-api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export function useCurrentUser() {
  return useQuery<Session | null, ApiError>({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => getCurrentUser(signal),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<Session, ApiError, LoginInput>({
    mutationFn: (input) => login(input),
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.me(), session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => logout(),
    onSuccess: async () => {
      queryClient.setQueryData(authKeys.me(), null);
      await queryClient.invalidateQueries();
    },
  });
}
