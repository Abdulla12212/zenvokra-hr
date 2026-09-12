import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { firstFieldMessage } from '@/lib/form-errors';

import type { Employee } from '../api/employees-api';
import { useUpdateEmployee } from '../api/employees-queries';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  workEmail: z.string().trim().email('Enter a valid email address.').max(320),
  password: z
    .string()
    .max(200)
    .refine((value) => value.length === 0 || value.length >= 8, 'Use at least 8 characters.'),
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  departmentName: z.string().trim().min(1, 'Enter a department.').max(200),
  location: z.string().trim().min(1, 'Enter a location.').max(200),
  status: z.enum(['Active', 'Remote', 'Probation']),
});

type FormValues = z.infer<typeof schema>;

export function EditEmployeeDialog({
  employee,
  onClose,
}: {
  employee: Employee | null;
  onClose: () => void;
}) {
  if (!employee) {
    return null;
  }

  return <EditEmployeeForm key={employee.id} employee={employee} onClose={onClose} />;
}

function EditEmployeeForm({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const updateMutation = useUpdateEmployee(employee.id);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: employee.fullName,
      workEmail: employee.workEmail,
      password: '',
      title: employee.title,
      departmentName: employee.departmentName,
      location: employee.location,
      status: statusValue(employee.status),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateMutation.mutateAsync({
        fullName: values.fullName,
        workEmail: values.workEmail,
        password: values.password.length > 0 ? values.password : undefined,
        title: values.title,
        departmentName: values.departmentName,
        location: values.location,
        status: values.status,
        managerName: employee.managerName,
        phone: employee.phone,
        teamName: employee.teamName,
        deskLabel: employee.deskLabel,
        hoursLabel: employee.hoursLabel,
        startedOn: employee.startedOn,
      });
      reset();
      toast.success(`Updated ${updated.fullName}.`);
      onClose();
    } catch (error) {
      const emailMessage = firstFieldMessage(error, 'workEmail');
      if (emailMessage) {
        setError('workEmail', { message: emailMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not update the employee.');
    }
  });

  const isBusy = isSubmitting || updateMutation.isPending;

  return (
    <Modal
      open
      title="Edit employee"
      className="max-w-lg"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <Field
          id="edit-employee-name"
          label="Full name"
          error={errors.fullName?.message}
          register={register('fullName')}
        />
        <Field
          id="edit-employee-email"
          label="Work email"
          type="email"
          autoComplete="off"
          error={errors.workEmail?.message}
          register={register('workEmail')}
        />
        <Field
          id="edit-employee-password"
          label="New password (optional)"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          register={register('password')}
        />
        <Field
          id="edit-employee-title"
          label="Title"
          error={errors.title?.message}
          register={register('title')}
        />
        <Field
          id="edit-employee-department"
          label="Department"
          error={errors.departmentName?.message}
          register={register('departmentName')}
        />
        <Field
          id="edit-employee-location"
          label="Location"
          error={errors.location?.message}
          register={register('location')}
        />
        <div className="space-y-1.5">
          <Label htmlFor="edit-employee-status">Status</Label>
          <select
            id="edit-employee-status"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            aria-invalid={errors.status ? true : undefined}
            aria-describedby={errors.status ? 'edit-employee-status-error' : undefined}
            {...register('status')}
          >
            <option value="Active">Active</option>
            <option value="Remote">Remote</option>
            <option value="Probation">Probation</option>
          </select>
          {errors.status ? (
            <p id="edit-employee-status-error" className="text-destructive text-xs" role="alert">
              {errors.status.message}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function statusValue(status: string): FormValues['status'] {
  if (status === 'Remote' || status === 'Probation') {
    return status;
  }

  return 'Active';
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  error,
  register,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
