import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TenantHomePage({ companyName }: { companyName: string }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to {companyName}</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Employee tools will appear here after you add people.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company workspace</CardTitle>
          <CardDescription>
            You are signed in as a tenant admin. This area is the template for the upcoming
            employee-facing product.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Nothing to review yet. When employees are added, their records and requests will land
          here.
        </CardContent>
      </Card>
    </div>
  );
}
