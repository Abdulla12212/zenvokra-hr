import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageTitle } from '@/components/page-title';
import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationProfile } from '@/features/organization/api/organization-api';
import { useOrganization, useUpdateOrganization } from '@/features/organization/api/organization-queries';
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
    <div className="space-y-4 p-6">
      <p className="text-muted-foreground text-xs">Home / Organization / Organization profile</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageTitle>Organization profile</PageTitle>
          <p className="text-muted-foreground text-sm">
            General organization details, provisioned subscription, and workplace settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
            }}
          >
            Discard changes
          </Button>
          <Button type="submit" form="organization-form" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Save changes
          </Button>
        </div>
      </div>

      <div className="bg-card flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-full text-sm font-semibold">
            {initials(profile.displayName)}
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.displayName}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge>Client tenant</Badge>
              <Badge variant="present">Active subscription</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {profile.subscriptionTier} · {profile.contractPeriod} · {profile.regionTimeZone}
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total seat limit</span>
            <b>
              {profile.activeSeats} / {profile.seatLimit}
            </b>
          </div>
          <ProgressBar value={seatPercent} className="mt-2" />
          <p className="text-muted-foreground mt-1 text-xs">
            {profile.activeSeats} active · {Math.max(0, profile.seatLimit - profile.activeSeats)} available
          </p>
        </div>
      </div>

      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <strong>SaaS plan & provisioned subscription</strong>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Lock className="size-3.5" aria-hidden="true" />
            Locked · entered by the platform owner
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Organization legal name" value={profile.legalName} />
          <ReadOnlyField label="Tenant ID / client code" value={profile.clientCode} />
          <ReadOnlyField label="Subscription tier" value={profile.subscriptionTier} />
          <ReadOnlyField label="Contract period" value={profile.contractPeriod} />
          <ReadOnlyField label="Employee seat limit" value={String(profile.seatLimit)} />
          <ReadOnlyField label="Region & timezone" value={profile.regionTimeZone} />
          <ReadOnlyField label="Platform support / SLA" value={profile.supportSla} />
          <ReadOnlyField label="Registered office" value={profile.registeredOffice} />
        </div>
      </section>

      <form id="organization-form" onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <strong>Organization contact & details</strong>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="displayName"
              label="Company display name"
              required
              error={form.formState.errors.displayName?.message}
            >
              <Input id="displayName" {...form.register('displayName')} />
            </Field>
            <Field
              id="workEmail"
              label="Official work email"
              required
              error={form.formState.errors.workEmail?.message}
            >
              <Input id="workEmail" type="email" {...form.register('workEmail')} />
            </Field>
            <Field id="supportHotline" label="Support / helpdesk hotline">
              <Input id="supportHotline" {...form.register('supportHotline')} />
            </Field>
            <Field id="officeLandline" label="Office landline">
              <Input id="officeLandline" {...form.register('officeLandline')} />
            </Field>
            <Field id="websiteUrl" label="Website">
              <Input id="websiteUrl" {...form.register('websiteUrl')} />
            </Field>
            <Field id="industry" label="Industry">
              <Input id="industry" {...form.register('industry')} />
            </Field>
            <Field id="fiscalYear" label="Fiscal year">
              <select id="fiscalYear" className={selectClass} {...form.register('fiscalYear')}>
                <option value="July – June">July – June</option>
                <option value="January – December">January – December</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <strong>Workplace & operating hours</strong>
          <div>
            <p className="mb-2 text-sm font-medium">Standard operating working days</p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const on = selectedDays.has(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium',
                      on
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground',
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
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <Field id="shiftTiming" label="Standard shift timing">
            <Input id="shiftTiming" {...form.register('shiftTiming')} />
          </Field>
          <Field id="officeFloors" label="Office floor & desk distribution">
            <Textarea id="officeFloors" rows={3} {...form.register('officeFloors')} />
          </Field>
        </section>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="bg-muted rounded-md border px-3 py-2 text-sm">{value}</div>
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
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const selectClass =
  'border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
