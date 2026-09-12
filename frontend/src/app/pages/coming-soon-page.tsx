function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  return (
    <ComingSoonPage
      title="Dashboard"
      description="Headcount and presence will appear here after attendance and leave are ported."
    />
  );
}

export function AdminApprovalsPage() {
  return (
    <ComingSoonPage
      title="Approvals"
      description="Leave and punch requests will land here in a later slice."
    />
  );
}

export function AdminOrganizationPage() {
  return (
    <ComingSoonPage
      title="Organization"
      description="Company contact and workplace details will land here in a later slice."
    />
  );
}

export function TimeOffPlaceholderPage() {
  return (
    <ComingSoonPage
      title="Time off"
      description="Balances and requests will land here after the leave slice is ported."
    />
  );
}

export function InboxPlaceholderPage() {
  return (
    <ComingSoonPage
      title="Inbox"
      description="Notifications will land here after the inbox slice is ported."
    />
  );
}
