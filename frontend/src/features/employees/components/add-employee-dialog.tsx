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

import { useCreateEmployee } from '../api/employees-queries';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Use at least 2 characters.').max(200),
  workEmail: z.string().trim().email('Enter a valid email address.').max(320),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
  employeeNumber: z.string().trim().min(1, 'Enter an employee number.').max(32),
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  departmentName: z.string().trim().min(1, 'Enter a department.').max(200),
  location: z.string().trim().min(1, 'Enter a location.').max(200),
});

type FormValues = z.infer<typeof schema>;

export function AddEmployeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      workEmail: '',
      password: '',
      employeeNumber: '',
      title: '',
      departmentName: '',
      location: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      reset();
      toast.success(`Added ${created.fullName}.`);
      onClose();
    } catch (error) {
      const emailMessage = firstFieldMessage(error, 'workEmail');
      if (emailMessage) {
        setError('workEmail', { message: emailMessage });
        return;
      }

      const numberMessage = firstFieldMessage(error, 'employeeNumber');
      if (numberMessage) {
        setError('employeeNumber', { message: numberMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not add the employee.');
    }
  });

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <Modal
      open={open}
      title="Add an employee"
      className="max-w-lg"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <Field
          id="employee-name"
          label="Full name"
          error={errors.fullName?.message}
          register={register('fullName')}
        />
        <Field
          id="employee-email"
          label="Work email"
          type="email"
          autoComplete="off"
          error={errors.workEmail?.message}
          register={register('workEmail')}
        />
        <Field
          id="employee-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          register={register('password')}
        />
        <Field
          id="employee-number"
          label="Employee number"
          error={errors.employeeNumber?.message}
          register={register('employeeNumber')}
        />
        <Field
          id="employee-title"
          label="Title"
          error={errors.title?.message}
          register={register('title')}
        />
        <Field
          id="employee-department"
          label="Department"
          error={errors.departmentName?.message}
          register={register('departmentName')}
        />
        <Field
          id="employee-location"
          label="Location"
          error={errors.location?.message}
          register={register('location')}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Create employee
          </Button>
        </div>
      </form>
    </Modal>
  );
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
