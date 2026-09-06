import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { firstFieldMessage } from '@/lib/form-errors';

import type { EmployeeDetail } from '../api/employees-api';
import { useUpdateEmployee } from '../api/employees-queries';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  workEmail: z.string().trim().min(3, 'Enter a work email.').max(320),
  title: z.string().trim().min(2).max(200),
  departmentName: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
  managerName: z.string().trim().max(200),
  phone: z.string().trim().max(40),
  teamName: z.string().trim().max(80),
  deskLabel: z.string().trim().max(120),
  hoursLabel: z.string().trim().max(32),
  status: z.enum(['Active', 'Remote', 'Probation']),
  startedOn: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function EditEmployeeDialog({
  employee,
  onClose,
}: {
  employee: EmployeeDetail;
  onClose: () => void;
}) {
  const updateMutation = useUpdateEmployee(employee.id);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: employee.fullName,
      workEmail: employee.workEmail,
      title: employee.title,
      departmentName: employee.departmentName,
      location: employee.location,
      managerName: employee.managerName,
      phone: employee.phone,
      teamName: employee.teamName,
      deskLabel: employee.deskLabel,
      hoursLabel: employee.hoursLabel,
      status: employee.status === 'Remote' || employee.status === 'Probation' ? employee.status : 'Active',
      startedOn: employee.startedOn,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        ...values,
        startedOn: values.startedOn.length > 0 ? values.startedOn : undefined,
      });
      toast.success('Profile updated.');
      onClose();
    } catch (error) {
      const emailError = firstFieldMessage(error, 'workEmail');
      if (emailError) {
        setError('workEmail', { message: emailError });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not update the employee.');
    }
  });

  const isBusy = isSubmitting || updateMutation.isPending;

  return (
    <div className="bg-background/70 fixed inset-0 z-50 grid place-items-center p-4">
      <div
        role="dialog"
        aria-labelledby="edit-employee-title"
        className="bg-card w-full max-w-2xl rounded-xl border shadow-lg"
      >
        <div className="flex items-start justify-between border-b px-6 py-4">
          <h2 id="edit-employee-title" className="text-base font-semibold">
            Edit profile
          </h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </Button>
        </div>
        <form onSubmit={(event) => void onSubmit(event)}>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <Field id="edit-fullName" label="Full name" required error={errors.fullName?.message}>
              <Input id="edit-fullName" {...register('fullName')} />
            </Field>
            <Field id="edit-workEmail" label="Work email" required error={errors.workEmail?.message}>
              <Input id="edit-workEmail" type="email" {...register('workEmail')} />
            </Field>
            <Field id="edit-title" label="Job title" required>
              <Input id="edit-title" {...register('title')} />
            </Field>
            <Field id="edit-departmentName" label="Department" required>
              <Input id="edit-departmentName" {...register('departmentName')} />
            </Field>
            <Field id="edit-location" label="Location" required>
              <Input id="edit-location" {...register('location')} />
            </Field>
            <Field id="edit-status" label="Status">
              <select id="edit-status" className={selectClass} {...register('status')}>
                <option value="Active">Active</option>
                <option value="Remote">Remote</option>
                <option value="Probation">Probation</option>
              </select>
            </Field>
            <Field id="edit-phone" label="Phone">
              <Input id="edit-phone" {...register('phone')} />
            </Field>
            <Field id="edit-hoursLabel" label="Hours">
              <Input id="edit-hoursLabel" {...register('hoursLabel')} />
            </Field>
            <Field id="edit-managerName" label="Manager">
              <Input id="edit-managerName" {...register('managerName')} />
            </Field>
            <Field id="edit-startedOn" label="Joining date">
              <Input id="edit-startedOn" type="date" {...register('startedOn')} />
            </Field>
            <Field id="edit-teamName" label="Team">
              <Input id="edit-teamName" {...register('teamName')} />
            </Field>
            <Field id="edit-deskLabel" label="Desk">
              <Input id="edit-deskLabel" {...register('deskLabel')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Save changes
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
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
