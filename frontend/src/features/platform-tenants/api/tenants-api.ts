import { api } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  adminCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface TenantAdmin {
  id: string;
  email: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ListTenantsParams {
  page?: number;
  pageSize?: number;
}

export interface CreateTenantInput {
  name: string;
}

export interface UpdateTenantInput {
  name: string;
  isActive?: boolean;
}

export interface CreateTenantAdminInput {
  email: string;
  password: string;
}

export interface UpdateTenantAdminInput {
  email?: string;
  password?: string;
}

const basePath = '/api/platform/tenants';

export function listTenants(
  params: ListTenantsParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<Tenant>> {
  return api.get<PagedResult<Tenant>>(basePath, {
    query: { page: params.page, pageSize: params.pageSize },
    signal,
  });
}

export function getTenant(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
  return api.get<Tenant>(`${basePath}/${tenantId}`, { signal });
}

export function createTenant(input: CreateTenantInput): Promise<Tenant> {
  return api.post<Tenant>(basePath, input);
}

export function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
  return api.put<Tenant>(`${basePath}/${tenantId}`, input);
}

export function deleteTenant(tenantId: string): Promise<void> {
  return api.delete<void>(`${basePath}/${tenantId}`);
}

export function listTenantAdmins(
  tenantId: string,
  params: ListTenantsParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<TenantAdmin>> {
  return api.get<PagedResult<TenantAdmin>>(`${basePath}/${tenantId}/admins`, {
    query: { page: params.page, pageSize: params.pageSize },
    signal,
  });
}

export function createTenantAdmin(
  tenantId: string,
  input: CreateTenantAdminInput,
): Promise<TenantAdmin> {
  return api.post<TenantAdmin>(`${basePath}/${tenantId}/admins`, input);
}

export function updateTenantAdmin(
  tenantId: string,
  adminId: string,
  input: UpdateTenantAdminInput,
): Promise<TenantAdmin> {
  return api.put<TenantAdmin>(`${basePath}/${tenantId}/admins/${adminId}`, input);
}

export function deleteTenantAdmin(tenantId: string, adminId: string): Promise<void> {
  return api.delete<void>(`${basePath}/${tenantId}/admins/${adminId}`);
}
