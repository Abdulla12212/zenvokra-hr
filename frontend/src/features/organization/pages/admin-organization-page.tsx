import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { firstFieldMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';

import type { OrganizationProfile } from '../api/organization-api';
import { useOrganization, useUpdateOrganization } from '../api/organization-queries';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const schema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  workEmail: z.string().trim().email('Enter a valid email address.').max(320),
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
  const { data, isPending, isError, error } = useOrganization();

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading organization</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {error.message}
      </p>
    );
  }

  return <OrganizationForm key={data.id} profile={data} />;
}

function OrganizationForm({ profile }: { profile: OrganizationProfile }) {
  const update = useUpdateOrganization();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(profile),
  });

  const [workingDays, setWorkingDays] = useState(profile.workingDays);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset(toValues(saved));
      setWorkingDays(saved.workingDays);
      toast.success('Organization profile saved.');
    } catch (cause) {
      const message = firstFieldMessage(cause, 'displayName') ?? 'Could not save the profile.';
      setError('displayName', { message });
    }
  });

  const seatsUsed = Math.min(100, Math.round((profile.activeSeats / profile.seatLimit) * 100));

  return (
    <form className="space-y-6" onSubmit={(event) => void onSubmit(event)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Organization profile</h1>
          <p className="text-muted-foreground text-sm">
            Contact and workplace settings. Plan fields stay locked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty || isSubmitting}
            onClick={() => {
              reset(toValues(profile));
              setWorkingDays(profile.workingDays);
            }}
          >
            Discard
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save changes
          </Button>
        </div>
      </header>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-lg font-semibold">{profile.displayName}</p>
            <p className="text-muted-foreground text-sm">
              {profile.subscriptionTier} · {profile.contractPeriod}
            </p>
          </div>
          <div className="sm:w-64">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Seat limit</span>
              <span>
                {profile.activeSeats} / {profile.seatLimit}
              </span>
            </div>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div className="bg-primary h-full" style={{ width: `${String(seatsUsed)}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">SaaS plan</h2>
          <p className="text-muted-foreground text-xs">Locked · entered by the platform owner</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <LockedField label="Organization legal name" value={profile.legalName} />
          <LockedField label="Tenant / client code" value={profile.clientCode} />
          <LockedField label="Subscription tier" value={profile.subscriptionTier} />
          <LockedField label="Contract period" value={profile.contractPeriod} />
          <LockedField label="Employee seat limit" value={String(profile.seatLimit)} />
          <LockedField label="Region & timezone" value={profile.regionTimeZone} />
          <LockedField label="Platform support / SLA" value={profile.supportSla} />
          <LockedField label="Registered office" value={profile.registeredOffice || '—'} />
        </div>
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Contact & details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field htmlFor="displayName" label="Company display name" error={errors.displayName?.message} required>
            <Input id="displayName" aria-invalid={Boolean(errors.displayName)} {...register('displayName')} />
          </Field>
          <Field htmlFor="workEmail" label="Official work email" error={errors.workEmail?.message} required>
            <Input id="workEmail" type="email" aria-invalid={Boolean(errors.workEmail)} {...register('workEmail')} />
          </Field>
          <Field htmlFor="supportHotline" label="Support / helpdesk hotline" error={errors.supportHotline?.message}>
            <Input id="supportHotline" {...register('supportHotline')} />
          </Field>
          <Field htmlFor="officeLandline" label="Office landline" error={errors.officeLandline?.message}>
            <Input id="officeLandline" {...register('officeLandline')} />
          </Field>
          <Field htmlFor="websiteUrl" label="Website" error={errors.websiteUrl?.message}>
            <Input id="websiteUrl" {...register('websiteUrl')} />
          </Field>
          <Field htmlFor="industry" label="Industry" error={errors.industry?.message}>
            <Input id="industry" {...register('industry')} />
          </Field>
          <Field htmlFor="fiscalYear" label="Fiscal year" error={errors.fiscalYear?.message}>
            <Input id="fiscalYear" {...register('fiscalYear')} />
          </Field>
        </div>
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Workplace & operating hours</h2>
        <div className="flex flex-wrap gap-2">
          {weekDays.map((day) => {
            const selected = workingDays.split(',').includes(day);
            return (
              <button
                key={day}
                type="button"
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground',
                )}
                onClick={() => {
                  const next = toggleDay(workingDays, day);
                  setWorkingDays(next);
                  setValue('workingDays', next, { shouldDirty: true });
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field htmlFor="shiftTiming" label="Standard shift timing" error={errors.shiftTiming?.message}>
            <Input id="shiftTiming" {...register('shiftTiming')} />
          </Field>
          <Field htmlFor="officeFloors" label="Office floors & desks" error={errors.officeFloors?.message}>
            <Input id="officeFloors" {...register('officeFloors')} />
          </Field>
        </div>
      </section>
    </form>
  );
}

function toValues(profile: OrganizationProfile): FormValues {
  return {
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
  };
}

function toggleDay(current: string, day: string): string {
  const selected = current.split(',').filter((value) => value.length > 0);
  return selected.includes(day)
    ? selected.filter((value) => value !== day).join(',')
    : [...selected, day].join(',');
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="bg-muted rounded-md px-3 py-2 text-sm">{value}</p>
    </div>
  );
}

function Field({
  htmlFor,
  label,
  error,
  required,
  children,
}: {
  htmlFor: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
