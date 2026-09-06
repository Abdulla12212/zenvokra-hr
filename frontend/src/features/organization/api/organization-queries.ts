import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import {
  getOrganization,
  updateOrganization,
  type OrganizationProfile,
  type UpdateOrganizationInput,
} from './organization-api';

export const organizationKeys = {
  all: ['organization'] as const,
  current: () => [...organizationKeys.all, 'current'] as const,
};

export function useOrganization() {
  return useQuery<OrganizationProfile, ApiError>({
    queryKey: organizationKeys.current(),
    queryFn: ({ signal }) => getOrganization(signal),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
