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
};

export function useOrganization() {
  return useQuery<OrganizationProfile, ApiError>({
    queryKey: organizationKeys.all,
    queryFn: ({ signal }) => getOrganization(signal),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<OrganizationProfile, ApiError, UpdateOrganizationInput>({
    mutationFn: (input) => updateOrganization(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
