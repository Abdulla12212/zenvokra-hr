import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Clock, Copy, Loader2, Lock, Mail, Phone, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
import { PageTitle } from '@/components/page-title';
import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationProfile } from '@/features/organization/api/organization-api';
import {
  useOrganization,
  useUpdateOrganization,
} from '@/features/organization/api/organization-queries';
import { firstFieldMessage } from '@/lib/form-errors';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const schema = z.object({
  displayName: z.string().trim().min(2).max(200),
  workEmail: z.string().trim().min(3).max(320),
  supportHotline: z.string().trim().max(40),
  officeLandline: z.string().trim().max(40),
  websiteUrl: z.string().trim().max(320),
  industry: z.string().trim().max(120),
  fiscalYear: z.string().trim().max(64),
  workingDays: z.string().trim().max(64),
  shiftTiming: z.string().trim().max(80),
  officeFloors: z.string().trim().max(400),
});

type FormValues = z.infer<typeof schema>;

export function AdminOrganizationPage() {
  const organization = useOrganization();

  if (organization.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (organization.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {organization.error.message}
      </p>
    );
  }

  const profile = organization.data;

  return <OrganizationForm key={profile.id} profile={profile} />;
}

function OrganizationForm({ profile }: { profile: OrganizationProfile }) {
  const update = useUpdateOrganization();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName,
      workEmail: profile.workEmail,
      supportHotline: profile.supportHotline,
      officeLandline: profile.officeLandline,
      websiteUrl: profile.websiteUrl,
      industry: profile.industry,
      fiscalYear: profile.fiscalYear,
      workingDays: profile.workingDays,
      shiftTiming: profile.shiftTiming,
      officeFloors: profile.officeFloors,
    },
  });

  const seatPercent = profile.seatLimit === 0 ? 0 : (profile.activeSeats / profile.seatLimit) * 100;
  const workingDaysValue = useWatch({ control: form.control, name: 'workingDays' }) ?? '';
  const selectedDays = new Set(workingDaysValue.split(',').filter((day) => day.length > 0));

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success('Organization profile saved.');
    } catch (error) {
      const emailError = firstFieldMessage(error, 'workEmail');
      if (emailError) {
        form.setError('workEmail', { message: emailError });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not save organization.');
    }
  });

  const isBusy = form.formState.isSubmitting || update.isPending;

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-8 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <AdminBreadcrumb
            items={[
              { label: 'Organization', to: '/admin/organization' },
              { label: 'Organization Profile' },
            ]}
          />
          <PageTitle>Organization profile</PageTitle>
          <p className="text-muted-foreground text-body-sm">
            General organization details, tenant subscription terms, and workplace settings.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            className="text-label-md rounded-xl"
            onClick={() => {
              form.reset();
            }}
          >
            Discard Changes
          </Button>
          <Button
            type="submit"
            form="organization-form"
            className="text-label-md rounded-xl"
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" strokeWidth={1.5} aria-hidden="true" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      <div className="bg-card flex flex-col items-start justify-between gap-6 overflow-hidden rounded-xl border p-6 shadow-sm xl:flex-row xl:items-center">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="bg-primary/10 text-primary text-headline-lg grid size-16 place-items-center rounded-xl border font-bold">
            {initials(profile.displayName)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-headline-sm font-semibold">{profile.displayName}</span>
              <Badge>Client Tenant</Badge>
              <Badge variant="present">Active Subscription</Badge>
            </div>
            <div className="text-muted-foreground text-body-sm flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Plan Tier:{' '}
                <strong className="text-foreground font-medium">{profile.subscriptionTier}</strong>
              </span>
              <span className="bg-border inline-block size-1 rounded-full" aria-hidden="true" />
              <span>
                Contract Period:{' '}
                <strong className="text-foreground font-medium">{profile.contractPeriod}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full min-w-[210px] flex-col gap-1.5 xl:w-auto xl:border-l xl:pl-6">
          <div className="text-label-xs flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total Seat Limit</span>
            <span className="text-primary font-bold">
              {profile.activeSeats} / {profile.seatLimit} Seats
            </span>
          </div>
          <ProgressBar value={seatPercent} className="h-2.5" />
          <div className="text-outline text-label-xs flex items-center justify-between">
            <span>{profile.activeSeats} Active</span>
            <span>{Math.max(0, profile.seatLimit - profile.activeSeats)} Available</span>
          </div>
        </div>
      </div>

      <section className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="bg-muted/60 flex flex-col justify-between gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Lock className="text-outline size-5" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-title-md font-semibold">SaaS Plan & Provisioned Subscription</p>
              <p className="text-muted-foreground text-label-xs">
                Core contracted tenancy specifications verified by Cloudesh operations
              </p>
            </div>
          </div>
          <span className="bg-muted text-muted-foreground text-label-xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium">
            <Lock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Locked · entered by the platform owner
          </span>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          <LockedField label="Organization Legal Name" value={profile.legalName} />
          <LockedField label="Tenant ID / Client Code" value={profile.clientCode} copyable />
          <LockedField label="Subscription Tier" value={profile.subscriptionTier} />
          <LockedField label="Contract Active Period" value={profile.contractPeriod} />
          <LockedField
            label="Employee Seat Limit"
            value={`${String(profile.seatLimit)} Active Licenses`}
            hint={`${String(profile.activeSeats)} used`}
          />
          <LockedField label="Region & Timezone" value={profile.regionTimeZone} />
          <LockedField label="Platform Support / SLA" value={profile.supportSla} />
          <LockedField label="Registered Permanent Office" value={profile.registeredOffice} />
        </div>
      </section>

      <form id="organization-form" onSubmit={(event) => void onSubmit(event)} className="space-y-6">
        <section className="bg-card space-y-6 rounded-xl border p-6 shadow-sm">
          <div className="border-b pb-1">
            <div className="flex items-center gap-2">
              <Building2
                className="text-primary-deep size-[22px]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 className="text-title-md font-semibold">Organization Contact & Details</h2>
            </div>
            <p className="text-muted-foreground text-body-sm mt-0.5">
              Update everyday contact and organizational details for company communications and
              employees.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field
              id="displayName"
              label="Company display name"
              required
              error={form.formState.errors.displayName?.message}
            >
              <Input
                id="displayName"
                className="bg-muted md:text-body-md rounded-xl"
                {...form.register('displayName')}
              />
            </Field>
            <Field
              id="workEmail"
              label="Official Work Email"
              required
              error={form.formState.errors.workEmail?.message}
            >
              <div className="relative">
                <Mail
                  className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <Input
                  id="workEmail"
                  type="email"
                  className="bg-muted md:text-body-md rounded-xl pl-9"
                  {...form.register('workEmail')}
                />
              </div>
            </Field>
            <Field id="supportHotline" label="Support / Helpdesk Hotline">
              <div className="relative">
                <Phone
                  className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <Input
                  id="supportHotline"
                  className="bg-muted md:text-body-md rounded-xl pl-9"
                  {...form.register('supportHotline')}
                />
              </div>
            </Field>
            <Field id="officeLandline" label="Secondary / Office Landline">
              <div className="relative">
                <Phone
                  className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <Input
                  id="officeLandline"
                  className="bg-muted md:text-body-md rounded-xl pl-9"
                  {...form.register('officeLandline')}
                />
              </div>
            </Field>
            <Field id="websiteUrl" label="Company Website URL">
              <Input
                id="websiteUrl"
                className="bg-muted md:text-body-md rounded-xl"
                {...form.register('websiteUrl')}
              />
            </Field>
            <Field id="industry" label="Industry & Sector">
              <Input
                id="industry"
                className="bg-muted md:text-body-md rounded-xl"
                {...form.register('industry')}
              />
            </Field>
            <Field id="fiscalYear" label="Fiscal Year / Tax Accounting Cycle">
              <select id="fiscalYear" className={selectClass} {...form.register('fiscalYear')}>
                <option value="July – June">July - June (Standard BD Fiscal Cycle)</option>
                <option value="January – December">January - December (Calendar Year)</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="bg-card space-y-6 rounded-xl border p-6 shadow-sm">
          <div className="border-b pb-1">
            <div className="flex items-center gap-2">
              <Clock
                className="text-primary-deep size-[22px]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 className="text-title-md font-semibold">Workplace & Operating Hours</h2>
            </div>
            <p className="text-muted-foreground text-body-sm mt-0.5">
              Define standard working days, shift timings, and official operating hours for staff.
            </p>
          </div>
          <div>
            <p className="text-label-md mb-2 font-medium">Standard Operating Working Days</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = selectedDays.has(day);
                const weekend = day === 'Sat' || day === 'Sun';
                return (
                  <button
                    key={day}
                    type="button"
                    className={cn(
                      'text-label-md rounded-xl border px-3.5 py-1.5 font-semibold',
                      on
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                    onClick={() => {
                      const next = new Set(selectedDays);
                      if (on) {
                        next.delete(day);
                      } else {
                        next.add(day);
                      }
                      form.setValue(
                        'workingDays',
                        WEEKDAYS.filter((item) => next.has(item)).join(','),
                        { shouldDirty: true },
                      );
                    }}
                  >
                    {weekend ? `${day} (Weekend)` : day}
                  </button>
                );
              })}
            </div>
            <p className="text-outline text-label-xs mt-2">
              Selected days are marked as regular business days in payroll and employee attendance
              calendars.
            </p>
          </div>
          <Field id="shiftTiming" label="Standard Shift Timing">
            <Input
              id="shiftTiming"
              className="bg-muted md:text-body-md rounded-xl"
              {...form.register('shiftTiming')}
            />
          </Field>
          <Field id="officeFloors" label="Office Floor & Desk Distribution">
            <Textarea
              id="officeFloors"
              rows={3}
              className="bg-muted md:text-body-md rounded-xl"
              {...form.register('officeFloors')}
            />
          </Field>
        </section>
      </form>
    </div>
  );
}

function LockedField({
  label,
  value,
  hint,
  copyable,
}: {
  label: string;
  value: string;
  hint?: string;
  copyable?: boolean;
}) {
  return (
    <div className="bg-muted/70 flex flex-col gap-1 rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-label-xs font-semibold tracking-wider uppercase">
          {label}
        </p>
        <Lock className="text-outline size-3.5" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <p className={cn('text-body-sm font-medium', copyable && 'text-primary font-semibold')}>
          {value}
          {hint ? (
            <span className="text-success text-label-xs ml-1 font-semibold">({hint})</span>
          ) : null}
        </p>
        {copyable ? (
          <button
            type="button"
            className="text-outline hover:text-foreground p-0.5"
            title="Copy client code"
            onClick={() => {
              void navigator.clipboard.writeText(value);
            }}
          >
            <Copy className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-label-md flex items-center justify-between">
        <span>{label}</span>
        {required ? <span className="text-destructive text-label-xs">* Required</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-label-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const selectClass =
  'border-input bg-muted text-body-md flex h-9 w-full rounded-xl border px-3 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
