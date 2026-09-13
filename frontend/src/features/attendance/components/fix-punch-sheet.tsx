import { zodResolver } from '@hookform/resolvers/zod';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { SheetPanel } from '@/components/sheet-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { homeHref, isoDate, monthTitle, type HomeSearch } from '@/lib/home-search';

import { useSaveStamp, useStampDraft } from '../api/attendance-queries';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  inTime: z.string().regex(timePattern, 'Use HH:MM.'),
  outTime: z.string().regex(timePattern, 'Use HH:MM.'),
  breakStart: z.string().regex(timePattern, 'Use HH:MM.'),
  breakEnd: z.string().regex(timePattern, 'Use HH:MM.'),
  note: z.string().max(400, 'Use at most 400 characters.'),
});

type FormValues = z.infer<typeof schema>;

export function FixPunchSheet({ search }: { search: HomeSearch }) {
  const date = isoDate(search.year, search.month, search.day);
  const draft = useStampDraft(date);

  if (draft.isPending) {
    return (
      <SheetPanel>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
      </SheetPanel>
    );
  }

  if (draft.isError || !draft.data) {
    return (
      <SheetPanel>
        <p role="alert" className="text-destructive text-sm">
          {draft.error?.message ?? 'Could not load this stamp.'}
        </p>
      </SheetPanel>
    );
  }

  return <FixPunchForm search={search} date={date} defaultValues={draft.data} />;
}

function FixPunchForm({
  search,
  date,
  defaultValues,
}: {
  search: HomeSearch;
  date: string;
  defaultValues: FormValues;
}) {
  const save = useSaveStamp();
  const navigate = useNavigate();
  const closeTo = homeHref({ ...search, sheet: null });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(
      { date, draft: values },
      {
        onSuccess: () => {
          toast.success('Stamp saved.');
          void navigate(closeTo);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  const isBusy = isSubmitting || save.isPending;

  return (
    <SheetPanel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Edit stamp
          </p>
          <h2 className="font-semibold">
            {search.day} {monthTitle(search.year, search.month)}
          </h2>
        </div>
        <Button variant="ghost" className="h-auto p-0 text-xs" asChild>
          <Link to={closeTo}>Close</Link>
        </Button>
      </div>

      <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-4">
          <TimeField
            id="in-time"
            label="In"
            error={errors.inTime?.message}
            {...register('inTime')}
          />
          <TimeField
            id="out-time"
            label="Out"
            error={errors.outTime?.message}
            {...register('outTime')}
          />
          <TimeField
            id="break-start"
            label="Break start"
            error={errors.breakStart?.message}
            {...register('breakStart')}
          />
          <TimeField
            id="break-end"
            label="Break end"
            error={errors.breakEnd?.message}
            {...register('breakEnd')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stamp-note">
            Note <span className="text-muted-foreground text-xs font-normal">optional</span>
          </Label>
          <Textarea
            id="stamp-note"
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={errors.note ? 'stamp-note-error' : undefined}
            {...register('note')}
          />
          {errors.note ? (
            <p id="stamp-note-error" className="text-destructive text-xs" role="alert">
              {errors.note.message}
            </p>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Saves immediately. No manager approval on stamps.
        </p>
        <Button type="submit" className="w-full" disabled={isBusy}>
          Save stamp
        </Button>
        <Button type="button" variant="ghost" className="w-full" asChild>
          <Link to={closeTo}>Cancel</Link>
        </Button>
      </form>
    </SheetPanel>
  );
}

function TimeField({
  id,
  label,
  error,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
} & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
