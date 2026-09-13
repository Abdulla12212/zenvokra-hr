import { api } from '@/lib/api-client';

export interface OrganizationProfile {
  id: string;
  displayName: string;
  workEmail: string;
  supportHotline: string;
  officeLandline: string;
  websiteUrl: string;
  industry: string;
  fiscalYear: string;
  workingDays: string;
  shiftTiming: string;
  officeFloors: string;
  legalName: string;
  clientCode: string;
  subscriptionTier: string;
  contractPeriod: string;
  seatLimit: number;
  activeSeats: number;
  regionTimeZone: string;
  supportSla: string;
  registeredOffice: string;
}

export interface UpdateOrganizationInput {
  displayName: string;
  workEmail: string;
  supportHotline: string;
  officeLandline: string;
  websiteUrl: string;
  industry: string;
  fiscalYear: string;
  workingDays: string;
  shiftTiming: string;
  officeFloors: string;
}

export function getOrganization(signal?: AbortSignal): Promise<OrganizationProfile> {
  return api.get<OrganizationProfile>('/api/organization', { signal });
}

export function updateOrganization(input: UpdateOrganizationInput): Promise<OrganizationProfile> {
  return api.patch<OrganizationProfile>('/api/organization', input);
}
