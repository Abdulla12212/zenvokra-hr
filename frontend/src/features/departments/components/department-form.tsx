import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

import { useCreateDepartment } from '../api/departments-queries';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 */

/**
 * Client-side rules, kept deliberately in step with the server's data annotations on
 * `CreateDepartment.Request`. The client copy exists for instant feedback; the server
 * copy is the one that is actually trusted.
 */
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(200, 'Use at most 200 characters.'),
});

type FormValues = z.infer<typeof schema>;

export function DepartmentForm() {
  const createMutation = useCreateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      reset();
      toast.success(`Created ${created.name}.`);
    } catch (error) {
      // Server-side validation and conflicts are shown on the field that caused them,
      // so the user does not have to guess which input to fix.
      const fieldMessage = firstFieldMessage(error, 'name');

      if (fieldMessage) {
        setError('name', { message: fieldMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not create the department.');
    }
  });

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <form
      // `void` because the handler is async and a form's onSubmit must return nothing;
      // errors are already handled inside it.
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="department-name" className="sr-only">
          Department name
        </Label>
        <Input
          id="department-name"
          placeholder="New department name"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'department-name-error' : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id="department-name-error" className="text-destructive text-xs" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isBusy}>
        {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Add department
      </Button>
    </form>
  );
}

/**
 * Finds the message to show on one field: either a server validation error for it, or
 * a conflict, which is always about the value the user just typed.
 *
 * Field names are compared case-insensitively because the server reports them in
 * PascalCase ("Name") while the form uses camelCase.
 */
function firstFieldMessage(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  const match = Object.entries(error.fieldErrors).find(
    ([key]) => key.toLowerCase() === field.toLowerCase(),
  );

  const serverMessage = match?.[1][0];

  if (serverMessage) {
    return serverMessage;
  }

  return error.status === 409 ? error.message : undefined;
}
