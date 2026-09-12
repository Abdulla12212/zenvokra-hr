import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

import {
  createTenant,
  createTenantAdmin,
  deleteTenant,
  deleteTenantAdmin,
  getTenant,
  listTenantAdmins,
  listTenants,
  updateTenant,
  updateTenantAdmin,
  type CreateTenantAdminInput,
  type CreateTenantInput,
  type ListTenantsParams,
  type Tenant,
  type TenantAdmin,
  type UpdateTenantAdminInput,
  type UpdateTenantInput,
} from './tenants-api';

export const tenantKeys = {
  all: ['platform-tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params: ListTenantsParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (tenantId: string) => [...tenantKeys.details(), tenantId] as const,
  admins: (tenantId: string) => [...tenantKeys.detail(tenantId), 'admins'] as const,
};

export function useTenants(params: ListTenantsParams = {}) {
  return useQuery<PagedResult<Tenant>, ApiError>({
    queryKey: tenantKeys.list(params),
    queryFn: ({ signal }) => listTenants(params, signal),
  });
}

export function useTenant(tenantId: string) {
  return useQuery<Tenant, ApiError>({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: ({ signal }) => getTenant(tenantId, signal),
  });
}

export function useTenantAdmins(tenantId: string) {
  return useQuery<PagedResult<TenantAdmin>, ApiError>({
    queryKey: tenantKeys.admins(tenantId),
    queryFn: ({ signal }) => listTenantAdmins(tenantId, {}, signal),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, ApiError, CreateTenantInput>({
    mutationFn: (input) => createTenant(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useUpdateTenant(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation<Tenant, ApiError, UpdateTenantInput>({
    mutationFn: (input) => updateTenant(tenantId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (tenantId) => deleteTenant(tenantId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useCreateTenantAdmin(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation<TenantAdmin, ApiError, CreateTenantAdminInput>({
    mutationFn: (input) => createTenantAdmin(tenantId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useUpdateTenantAdmin(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation<TenantAdmin, ApiError, { adminId: string; input: UpdateTenantAdminInput }>({
    mutationFn: ({ adminId, input }) => updateTenantAdmin(tenantId, adminId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.admins(tenantId) });
    },
  });
}

export function useDeleteTenantAdmin(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (adminId) => deleteTenantAdmin(tenantId, adminId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
