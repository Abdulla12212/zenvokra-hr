import { useNavigate } from 'react-router';

import mushroomAvatar from '@/assets/mushroom-avatar.svg';
import { Button } from '@/components/ui/button';
import { demoSession } from '@/lib/demo-session';
import { continueSession } from '@/lib/session-stub';
import { initials } from '@/lib/initials';

export function ContinuePage() {
  const navigate = useNavigate();
  const employee = demoSession.employee;

  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="bg-card w-full max-w-[460px] rounded-xl border p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold tracking-tight">
            C
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Cloudesh</p>
            <p className="text-muted-foreground text-xs">{demoSession.tenantName}</p>
          </div>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Continue</h1>
        <p className="text-muted-foreground mb-5 text-xs">
          Session stub. Same tenant, two personas. No passwords.
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-md border p-3">
            <img src={mushroomAvatar} alt="" className="bg-muted size-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{employee.fullName}</p>
              <p className="text-muted-foreground text-xs">
                {employee.employeeNumber} · {employee.department} · Employee app
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                continueSession('employee');
                void navigate('/');
              }}
            >
              Continue
            </Button>
          </div>
          <div className="border-primary bg-primary/5 flex items-center gap-3 rounded-md border p-3">
            <div className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-full text-xs font-semibold">
              {initials(employee.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{employee.fullName}</p>
              <p className="text-muted-foreground text-xs">
                Admin · {demoSession.location} · Organization
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                continueSession('admin');
                void navigate('/admin');
              }}
            >
              Open admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
