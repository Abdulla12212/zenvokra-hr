import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/page-title';
import { demoSession } from '@/lib/demo-session';

const ARTICLES = [
  {
    id: 'punch',
    title: 'Punch in and out',
    body: 'Open Home and use Punch in or Punch out. The stamp is Dhaka HQ. There is no approval on punches.',
  },
  {
    id: 'edit',
    title: 'Edit a punch',
    body: 'Use Fix punch or Edit stamp. The change saves immediately — no manager approval on stamps.',
  },
  {
    id: 'request',
    title: 'Request time off',
    body: 'Request time off from the header. Nadia reviews Annual, Casual, and Sick. Closed days are not leave.',
  },
  {
    id: 'closed',
    title: 'Closed days vs leave',
    body: 'Company Day on 5 Sep is paid and not deducted. Leave is Annual, Casual, or Sick on your own request.',
  },
] as const;

export function HelpPage() {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = ARTICLES.filter((article) =>
    article.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <PageTitle>Help</PageTitle>
      </div>
      <div className="mb-4">
        <Label htmlFor="help-search" className="sr-only">
          Search
        </Label>
        <Input
          id="help-search"
          placeholder="Search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl border shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No matching articles.</p>
          ) : (
            filtered.map((article) => (
              <div key={article.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                  onClick={() => {
                    setOpenId((current) => (current === article.id ? null : article.id));
                  }}
                >
                  {article.title}
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                </button>
                {openId === article.id ? (
                  <p className="text-muted-foreground px-4 pb-3 text-sm">{article.body}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <p className="mb-2 font-semibold">People Ops</p>
          <p className="text-muted-foreground mb-4 text-sm">
            {demoSession.tenantName} · same working day.
          </p>
          <Button asChild>
            <a href="mailto:people@acmeconsulting.test">Email</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
