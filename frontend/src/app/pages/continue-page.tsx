import { useNavigate } from 'react-router';

import mushroomAvatar from '@/assets/mushroom-avatar.svg';
import { Button } from '@/components/ui/button';
import { demoSession } from '@/lib/demo-session';
import { continueSession } from '@/lib/session-stub';

export function ContinuePage() {
  const navigate = useNavigate();
  const employee = demoSession.employee;

  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="bg-card w-full max-w-[400px] rounded-xl border p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold tracking-tight">
            C
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Cloudesh</p>
            <p className="text-muted-foreground text-xs">{demoSession.tenantName}</p>
          </div>
        </div>
        <h1 className="mt-4 mb-5 text-xl font-semibold tracking-tight">Continue</h1>
        <div className="mb-4 flex items-center gap-3 rounded-md border p-3">
          <img src={mushroomAvatar} alt="" className="bg-muted size-10 rounded-full object-cover" />
          <div>
            <p className="font-medium">{employee.fullName}</p>
            <p className="text-muted-foreground text-xs">
              {employee.employeeNumber} · {employee.department}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            continueSession();
            void navigate('/');
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
