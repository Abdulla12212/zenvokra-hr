import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { firstFieldMessage } from '@/lib/form-errors';

import { useCreateTenantAdmin } from '../api/tenants-queries';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(320),
  password: z.string().min(8, 'Use at least 8 characters.').max(200, 'Use at most 200 characters.'),
});

type FormValues = z.infer<typeof schema>;

export function TenantAdminFormDialog({
  tenantId,
  open,
  onClose,
}: {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateTenantAdmin(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(values);
      reset();
      toast.success(`Added ${created.email}.`);
      onClose();
    } catch (error) {
      const fieldMessage = firstFieldMessage(error, 'email');

      if (fieldMessage) {
        setError('email', { message: fieldMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not add the tenant admin.');
    }
  });

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <Modal
      open={open}
      title="Add a tenant admin"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="off"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'admin-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="admin-email-error" className="text-destructive text-xs" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'admin-password-error' : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="admin-password-error" className="text-destructive text-xs" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Add admin
          </Button>
        </div>
      </form>
    </Modal>
  );
}
