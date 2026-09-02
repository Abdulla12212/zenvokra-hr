import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { departments, locations } from '../data/seed';
import type { CreateEmployeeInput, EmploymentStatus } from '../types';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Use at least 2 characters.').max(200, 'Use at most 200 characters.'),
  workEmail: z.string().trim().email('Enter a valid work email.'),
  phone: z.string().trim().max(40, 'Use at most 40 characters.'),
  department: z.string().trim().min(1, 'Choose a department.'),
  jobTitle: z.string().trim().min(2, 'Use at least 2 characters.').max(200, 'Use at most 200 characters.'),
  startDate: z.string().trim().min(1, 'Choose a start date.'),
  location: z.string().trim().min(1, 'Choose a location.'),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof schema>;

export function AddEmployeeForm({
  nextEmployeeId,
  onOpenChange,
  onSave,
}: {
  nextEmployeeId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateEmployeeInput) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      workEmail: '',
      phone: '',
      department: '',
      jobTitle: '',
      startDate: '',
      location: '',
      status: 'active',
    },
  });

  const status = watch('status');
  const onSubmit = handleSubmit((values) => {
    onSave(values);
    onOpenChange(false);
  });

  return (
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-employee-title"
      className="bg-card relative z-10 w-full max-w-lg rounded-xl border p-5 shadow-lg"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="add-employee-title" className="text-base font-semibold">
            Add employee
          </h2>
          <p className="text-muted-foreground text-xs">
            Required fields to create the record. Invitation can wait.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Close"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="fullName" label="Full name" error={errors.fullName?.message}>
          <Input id="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
        </Field>
        <Field id="workEmail" label="Work email" error={errors.workEmail?.message}>
          <Input
            id="workEmail"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.workEmail)}
            {...register('workEmail')}
          />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message}>
          <Input id="phone" autoComplete="tel" {...register('phone')} />
        </Field>
        <Field id="department" label="Department" error={errors.department?.message}>
          <NativeSelect id="department" aria-invalid={Boolean(errors.department)} {...register('department')}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="jobTitle" label="Job title" error={errors.jobTitle?.message}>
          <Input id="jobTitle" aria-invalid={Boolean(errors.jobTitle)} {...register('jobTitle')} />
        </Field>
        <Field id="startDate" label="Start date" error={errors.startDate?.message}>
          <Input id="startDate" type="date" aria-invalid={Boolean(errors.startDate)} {...register('startDate')} />
        </Field>
        <Field id="location" label="Location" error={errors.location?.message}>
          <NativeSelect id="location" aria-invalid={Boolean(errors.location)} {...register('location')}>
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="employeeId" label="Employee ID">
          <Input id="employeeId" value={nextEmployeeId} readOnly />
        </Field>
      </div>

      <StatusField
        status={status}
        onChange={(next) => {
          setValue('status', next);
        }}
      />

      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">Save employee</Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function NativeSelect(props: ComponentProps<'select'>) {
  return (
    <select
      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm outline-none"
      {...props}
    />
  );
}

function StatusField({
  status,
  onChange,
}: {
  status: EmploymentStatus;
  onChange: (status: EmploymentStatus) => void;
}) {
  return (
    <fieldset className="mt-3">
      <legend className="mb-1.5 text-sm font-medium">Status</legend>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(status === 'active' && 'border-primary text-primary')}
          onClick={() => {
            onChange('active');
          }}
        >
          Active
        </Button>
        <Button
          type="button"
          variant={status === 'inactive' ? 'outline' : 'ghost'}
          onClick={() => {
            onChange('inactive');
          }}
        >
          Inactive
        </Button>
      </div>
    </fieldset>
  );
}
