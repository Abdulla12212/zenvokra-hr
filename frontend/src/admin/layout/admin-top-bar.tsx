import { Bell, CircleHelp, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { MonogramAvatar } from '../components/monogram-avatar';
import { initialsFromName } from '../lib/initials';

export function AdminTopBar() {
  return (
    <header className="bg-card flex h-12 shrink-0 items-center gap-4 border-b px-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold">
          C
        </div>
        <span className="text-sm font-semibold tracking-tight">Cloudesh HR</span>
      </div>

      <form
        className="mx-auto hidden w-full max-w-xl md:block"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="relative block">
          <span className="sr-only">Search employees, requests, IDs</span>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            className="h-9 bg-background pr-14 pl-9"
            placeholder="Search employees, requests, IDs"
            name="q"
          />
          <kbd className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </label>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications, 3 unread">
          <span className="relative">
            <Bell aria-hidden="true" />
            <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full text-[10px] font-medium">
              3
            </span>
          </span>
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Help">
          <CircleHelp aria-hidden="true" />
        </Button>
        <div className="ml-1 flex items-center gap-2 pl-2">
          <MonogramAvatar initials={initialsFromName('Aisha Rahman')} />
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium">AR</p>
            <p className="text-muted-foreground text-[11px]">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
