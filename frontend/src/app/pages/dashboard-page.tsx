import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const nextSteps = [
  {
    title: 'Read the architecture notes',
    description: 'How tenancy, vertical slices, and the container setup fit together.',
    path: 'docs/ARCHITECTURE.md',
  },
  {
    title: 'Follow the feature recipe',
    description: 'Build one slice end to end, from migration to React page.',
    path: 'docs/ADD-A-FEATURE.md',
  },
  {
    title: 'Delete the walking skeleton',
    description:
      'Departments exists only to prove the plumbing. Remove it when real features land.',
    path: 'grep -rl "WALKING SKELETON" backend frontend',
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cloudesh HR</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          The scaffolding is in place: a .NET 10 Minimal API, PostgreSQL with EF Core, tenant
          isolation enforced in the data layer, and this React app. No HR features have been built
          yet.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verify the stack</CardTitle>
          <CardDescription>
            The Departments page reads and writes through the API, so if it works, every layer
            works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/departments">Open Departments</Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Next steps</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {nextSteps.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle className="text-sm">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs break-all">
                  {step.path}
                </code>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
