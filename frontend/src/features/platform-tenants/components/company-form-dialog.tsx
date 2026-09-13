import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { firstFieldMessage } from '@/lib/form-errors';

import { useCreateTenant } from '../api/tenants-queries';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(200, 'Use at most 200 characters.'),
});

type FormValues = z.infer<typeof schema>;

export function CompanyFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const createMutation = useCreateTenant();

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
      toast.success(`Created ${created.name}. Add a tenant admin so they can sign in.`);
      onClose();
      void navigate(`/tenants/${created.id}`);
    } catch (error) {
      const fieldMessage = firstFieldMessage(error, 'name');

      if (fieldMessage) {
        setError('name', { message: fieldMessage });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Could not create the company.');
    }
  });

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <Modal
      open={open}
      title="Add a company"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Company name</Label>
          <Input
            id="company-name"
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'company-name-error' : undefined}
            {...register('name')}
          />
          {errors.name ? (
            <p id="company-name-error" className="text-destructive text-xs" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Create company
          </Button>
        </div>
      </form>
    </Modal>
  );
}
