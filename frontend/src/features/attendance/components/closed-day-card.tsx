import { Badge } from '@/components/ui/badge';

export function ClosedDayCard() {
  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
        Closed day
      </p>
      <p className="text-muted-foreground mt-1 text-xs">Sat 5 Sep</p>
      <p className="mt-1 mb-2.5 text-base font-semibold">Company Day</p>
      <Badge variant="rejected">Closed</Badge>
      <dl className="mt-3.5 flex flex-col gap-2 text-[13px]">
        <div className="flex justify-between gap-2.5">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">Acme Consulting</dd>
        </div>
        <div className="flex justify-between gap-2.5">
          <dt className="text-muted-foreground">Pay</dt>
          <dd className="font-medium">Paid</dd>
        </div>
        <div className="flex justify-between gap-2.5">
          <dt className="text-muted-foreground">Leave</dt>
          <dd className="font-medium">Not deducted</dd>
        </div>
        <div className="flex justify-between gap-2.5">
          <dt className="text-muted-foreground">Shift</dt>
          <dd className="font-medium">None · office shut</dd>
        </div>
      </dl>
    </div>
  );
}
