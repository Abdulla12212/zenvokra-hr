import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { firstFieldMessage } from '@/lib/form-errors';

import { useCreateEmployee } from '../api/employees-queries';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  workEmail: z.string().trim().min(3, 'Enter a work email.').max(320),
  employeeNumber: z.string().trim().min(3).max(32),
  departmentName: z.string().trim().min(2).max(200),
  title: z.string().trim().min(2, 'Enter a job title.').max(200),
  location: z.string().trim().min(2).max(200),
  phone: z.string().trim().max(40),
  hoursLabel: z.string().trim().max(32),
  managerName: z.string().trim().max(200),
  startedOn: z.string(),
  teamName: z.string().trim().max(80),
  deskLabel: z.string().trim().max(120),
});

type FormValues = z.infer<typeof schema>;

const departments = ['Engineering', 'Design & Product', 'Operations', 'People Ops & HR', 'Marketing'];
const locations = ['Dhaka HQ', 'Remote / Hybrid'];

export function AddEmployeeDialog({
  nextNumber,
  onClose,
}: {
  nextNumber: string;
  onClose: () => void;
}) {
  const createMutation = useCreateEmployee();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      workEmail: '',
      employeeNumber: nextNumber,
      departmentName: 'Engineering',
      title: '',
      location: 'Dhaka HQ',
      phone: '',
      hoursLabel: '09:00–18:00',
      managerName: 'Nadia Chowdhury',
      startedOn: '',
      teamName: '',
      deskLabel: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync({
        ...values,
        startedOn: values.startedOn.length > 0 ? values.startedOn : undefined,
      });
      toast.success(`Saved ${created.fullName}.`);
      onClose();
    } catch (error) {
      const field =
        firstFieldMessage(error, 'employeeNumber') ??
        firstFieldMessage(error, 'workEmail') ??
        firstFieldMessage(error, 'fullName');

      if (field && firstFieldMessage(error, 'employeeNumber')) {
        setError('employeeNumber', { message: field });
        return;
      }

      if (field && firstFieldMessage(error, 'workEmail')) {
        setError('workEmail', { message: field });
        return;
      }

      if (field) {
        setError('fullName', { message: field });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not save the employee.');
    }
  });

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <div className="bg-background/70 fixed inset-0 z-50 grid place-items-center p-4">
      <div
        role="dialog"
        aria-labelledby="add-employee-title"
        className="bg-card w-full max-w-2xl rounded-xl border shadow-lg"
      >
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 id="add-employee-title" className="text-base font-semibold">
              Add new employee
            </h2>
            <p className="text-muted-foreground text-xs">
              Registers a person on the Acme Consulting tenant.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </Button>
        </div>
        <form onSubmit={(event) => void onSubmit(event)}>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
              <Input
                id="fullName"
                placeholder="e.g. Farhana Ahmed"
                aria-invalid={errors.fullName ? true : undefined}
                {...register('fullName')}
              />
            </Field>
            <Field id="workEmail" label="Work email" required error={errors.workEmail?.message}>
              <Input
                id="workEmail"
                type="email"
                placeholder="farhana.a@acmeconsulting.test"
                aria-invalid={errors.workEmail ? true : undefined}
                {...register('workEmail')}
              />
            </Field>
            <Field
              id="employeeNumber"
              label="Employee ID"
              required
              error={errors.employeeNumber?.message}
            >
              <Input
                id="employeeNumber"
                aria-invalid={errors.employeeNumber ? true : undefined}
                {...register('employeeNumber')}
              />
            </Field>
            <Field id="departmentName" label="Department" required>
              <select id="departmentName" className={selectClass} {...register('departmentName')}>
                {departments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="title" label="Role / job title" required error={errors.title?.message}>
              <Input
                id="title"
                placeholder="e.g. Software Engineer"
                aria-invalid={errors.title ? true : undefined}
                {...register('title')}
              />
            </Field>
            <Field id="location" label="Workstation / location" required>
              <select id="location" className={selectClass} {...register('location')}>
                {locations.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="phone" label="Phone number">
              <Input id="phone" placeholder="+880 1700-000000" {...register('phone')} />
            </Field>
            <Field id="hoursLabel" label="Work shift">
              <Input id="hoursLabel" {...register('hoursLabel')} />
            </Field>
            <Field id="managerName" label="Reporting manager">
              <Input id="managerName" {...register('managerName')} />
            </Field>
            <Field id="startedOn" label="Joining date">
              <Input id="startedOn" type="date" {...register('startedOn')} />
            </Field>
            <Field id="teamName" label="Team">
              <Input id="teamName" placeholder="Platform Team" {...register('teamName')} />
            </Field>
            <Field id="deskLabel" label="Desk">
              <Input id="deskLabel" placeholder="Floor 4, Desk 4B-12" {...register('deskLabel')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Save employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const selectClass =
  'border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

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
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
