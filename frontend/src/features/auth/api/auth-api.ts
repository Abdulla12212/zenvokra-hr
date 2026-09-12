import { ApiError, api } from '@/lib/api-client';

export type SessionRole = 'PlatformAdmin' | 'TenantAdmin';

export interface Session {
  userId: string;
  email: string;
  role: SessionRole;
  tenantId: string | null;
  tenantName: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<Session> {
  return api.post<Session>('/api/auth/login', input);
}

export async function logout(): Promise<void> {
  await api.post<void>('/api/auth/logout', {});
}

export async function getCurrentUser(signal?: AbortSignal): Promise<Session | null> {
  try {
    return await api.get<Session>('/api/auth/me', { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
