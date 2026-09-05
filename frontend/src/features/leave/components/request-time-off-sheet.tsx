import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SheetPanel } from '@/components/sheet-panel';
import { homeHref, type CalendarMonth } from '@/lib/home-search';

import { useCreateLeaveRequest } from '../api/leave-queries';

const schema = z.object({
  type: z.enum(['Annual', 'Casual', 'Sick']),
  fromLabel: z.string().trim().min(1, 'Choose a start date.'),
  toLabel: z.string().trim().min(1, 'Choose an end date.'),
  note: z.string().trim().max(400, 'Use at most 400 characters.'),
});

type FormValues = z.infer<typeof schema>;

export function RequestTimeOffSheet({ month, day }: { month: CalendarMonth; day: number }) {
  const create = useCreateLeaveRequest();
  const navigate = useNavigate();
  const closeTo = homeHref({ month, day });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Annual',
      fromLabel: 'Tue 25 Aug 2026',
      toLabel: 'Wed 26 Aug 2026',
      note: 'Family visit.',
    },
  });

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (request) => {
        toast.success('Request sent.');
        void navigate(`/time-off/${request.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  });

  const isBusy = isSubmitting || create.isPending;

  return (
    <SheetPanel>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">Request time off</h2>
        <Button variant="ghost" className="h-auto p-0 text-xs" asChild>
          <Link to={closeTo}>Close</Link>
        </Button>
      </div>

      <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3.5">
        <Field id="leave-type" label="Type" error={errors.type?.message}>
          <select
            id="leave-type"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            aria-invalid={errors.type ? true : undefined}
            {...register('type')}
          >
            <option value="Annual">Annual</option>
            <option value="Casual">Casual</option>
            <option value="Sick">Sick</option>
          </select>
        </Field>
        <Field id="leave-from" label="From" error={errors.fromLabel?.message}>
          <Input id="leave-from" aria-invalid={errors.fromLabel ? true : undefined} {...register('fromLabel')} />
        </Field>
        <Field id="leave-to" label="To" error={errors.toLabel?.message}>
          <Input id="leave-to" aria-invalid={errors.toLabel ? true : undefined} {...register('toLabel')} />
        </Field>
        <div className="space-y-1.5">
          <Label htmlFor="leave-days">Working days</Label>
          <Input id="leave-days" value="2 · 10 left after" readOnly className="bg-muted" />
        </div>
        <Field id="leave-note" label="Note" error={errors.note?.message}>
          <Textarea
            id="leave-note"
            className="min-h-16"
            aria-invalid={errors.note ? true : undefined}
            {...register('note')}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isBusy}>
          Send
        </Button>
        <Button type="button" variant="ghost" className="w-full" asChild>
          <Link to={closeTo}>Cancel</Link>
        </Button>
      </form>
    </SheetPanel>
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
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
