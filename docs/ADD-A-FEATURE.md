# Adding a feature

Read [CODING-CONVENTIONS-DOTNET.md](CODING-CONVENTIONS-DOTNET.md) and
[CODING-CONVENTIONS-REACT.md](CODING-CONVENTIONS-REACT.md) first; this document is the
sequence, not the rules.

The shipped `Departments` feature is the file shape to copy for **list and create** slices
(leave requests, punches). Every file involved is marked `WALKING SKELETON`.

## One tenant, two personas

| Fixed | Value |
| ----- | ----- |
| Tenant | Acme Consulting (`Tenancy:DefaultTenantId` in Development) |
| Employee persona | Akram Hossain · EMP-1024 · Home / Time off / Inbox |
| Admin persona | Same Akram · Dashboard / Employees / Approvals / Organization |

- Seed Acme. There is no platform-owner tenant screen yet. Organization Profile edits
  that one tenant's contact and workplace; plan fields stay read-only.
- Isolation tests still create a second tenant. That tenant is a security check, not a
  second company in the UI.
- Continue is a session stub that picks Employee or Admin. Do not add passwords, JWT, or
  a second tenant-resolution path.
- **Do not mix chrome.** Employee nav stays Home / Time off / Inbox. Admin nav is
  Dashboard / Employees / Approvals / Organization. Specs: `docs/ux-employee` and
  `docs/ux-admin`.
- `GET /api/employees/me` is the employee-app persona. Prefer EMP-1024 when the tenant
  has a roster — `SingleOrDefault` over every employee breaks as soon as admin creates a
  second row.
- List / create / update employee and grant / decline requests are **admin slices**. Do
  not add a People table to the employee shell.

Persona extras and the frozen clock (**Thu 20 Aug 2026**) live in
`frontend/src/lib/demo-session.ts` until `/me` serves them. Do not use `new Date()`.

---

## The employee record (this featureset)

```
backend/src/Cloudesh.Application/
├── Domain/Employees/Employee.cs
├── Domain/Organization/OrganizationProfile.cs
├── Domain/Approvals/PunchCorrection.cs
├── Infrastructure/Persistence/Configurations/EmployeeConfiguration.cs
├── Infrastructure/Persistence/AppDbContext.cs          (Employees, Organization, PunchCorrections)
├── Infrastructure/Persistence/DatabaseSeeder.cs        (Akram + roster + org)
├── Features/Employees/                                 (/me plus admin list/create/update)
├── Features/Organization/
├── Features/Approvals/
├── Features/Dashboard/
└── Migrations/                                          (generated)

backend/tests/
├── Cloudesh.UnitTests/Persistence/EmployeeTenantIsolationTests.cs
└── Cloudesh.IntegrationTests/EmployeesEndpointsTests.cs

frontend/src/
├── lib/demo-session.ts + session-stub.ts                (persona + frozen clock)
├── app/layout/admin-shell.tsx
├── app/pages/admin-*-page.tsx                           (dashboard, employees, approvals, org)
├── features/employees/api/                              (/me plus admin list/create/update)
├── features/organization/api/
├── features/approvals/api/
└── features/dashboard/api/
```

Employee chrome stays Home / Time off / Inbox — no People item there. Admin chrome is
Dashboard / Employees / Approvals / Organization. Nothing in `Program.cs`.

### 1. The entity

```csharp
// Domain/Employees/Employee.cs
using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Employees;

public sealed class Employee : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string FullName { get; set; }
    public required string EmployeeNumber { get; set; }
    public required string WorkEmail { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static Employee Create(string fullName, string employeeNumber, string workEmail) => new()
    {
        Id = Guid.CreateVersion7(),
        FullName = fullName,
        EmployeeNumber = employeeNumber,
        WorkEmail = workEmail,
    };
}
```

Profile fields (title, manager, hours, timezone, emergency contact) belong on this same
row. Do not add a second user/people entity in this featureset.

`ITenantScoped` is the whole of the tenancy work. `AppDbContext` finds the entity by
reflection and applies the isolation filter; the save interceptor stamps and guards
`TenantId`. There is nothing to register.

### 2. The EF configuration

```csharp
// Infrastructure/Persistence/Configurations/EmployeeConfiguration.cs
internal sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(employee => employee.Id);
        builder.Property(employee => employee.Id).ValueGeneratedNever();

        builder.Property(employee => employee.FullName).HasMaxLength(200).IsRequired();
        builder.Property(employee => employee.EmployeeNumber).HasMaxLength(32).IsRequired();
        builder.Property(employee => employee.WorkEmail).HasMaxLength(320).IsRequired();

        // Lead with TenantId: it matches how every query filters, and doubles as the
        // index EF would otherwise create for the tenant foreign key.
        builder.HasIndex(employee => new { employee.TenantId, employee.EmployeeNumber }).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(employee => employee.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

Picked up automatically by `ApplyConfigurationsFromAssembly`.

### 3. The `DbSet`

```csharp
public DbSet<Employee> Employees => Set<Employee>();
```

### 4. The migration

```bash
make migrate-add NAME=AddEmployees
```

Read the generated SQL before committing. EF occasionally turns a rename into a
drop-and-add, and loses the column's data doing it.

### 5. Seed Akram into the demo tenant

Not a `POST /employees`. One row, idempotent, inside the existing seeder scope:

```csharp
if (!await dbContext.Employees.AnyAsync(cancellationToken))
{
    dbContext.Employees.Add(Employee.Create(
        "Akram Hossain",
        "EMP-1024",
        "akram.hossain@acmeconsulting.test"));
    await dbContext.SaveChangesAsync(cancellationToken);
}
```

`TenantId` is left unset: the interceptor stamps it because seeding already opened a
tenant scope. Seed Akram first. Admin roster rows are extra seeds for the same tenant.

### 6. The read slice

```csharp
// Features/Employees/GetCurrentEmployee.cs
public static class GetCurrentEmployee
{
    public sealed record Response(Guid Id, string FullName, string EmployeeNumber, string WorkEmail);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);
        // Prefer EMP-1024 when the tenant has a roster.

        return employee is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(/* map Info / row to Response */);
    }
}
```

No tenant filter. That is not an omission — the query filter adds it. Do not
`SingleOrDefault` the whole table once admin has created more people.

### 7. The routes

```csharp
// Features/Employees/EmployeeEndpoints.cs
public sealed class EmployeeEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        var employees = routes.MapGroup("/employees").WithTags("Employees");

        employees.MapGet("/me", GetCurrentEmployee.HandleAsync)
            .WithName(nameof(GetCurrentEmployee))
            .WithSummary("Returns the employee-app persona (prefer EMP-1024).");
    }
}
```

Discovered by assembly scan. `Program.cs` is not touched. List and create belong on the
same group as admin slices (`GET /employees`, `POST /employees`), not on `/me`.

### 8. Backend tests

An isolation test is not optional — it is the one test whose absence can turn into a data
breach. The second tenant exists only here:

```csharp
[Fact]
public async Task Employees_are_invisible_to_other_tenants()
{
    await using var fixture = await SqliteDbContextFixture.CreateAsync();

    Guid acme = await fixture.AddTenantAsync("acme");
    Guid globex = await fixture.AddTenantAsync("globex");

    using (fixture.TenantContext.BeginScope(globex))
    {
        fixture.DbContext.Employees.Add(
            Employee.Create("Not Yours", "EMP-9999", "nope@globex.test"));
        await fixture.DbContext.SaveChangesAsync();
    }

    fixture.DbContext.ChangeTracker.Clear();
    fixture.TenantContext.TenantId = acme;

    (await fixture.DbContext.Employees.AsNoTracking().ToListAsync()).ShouldBeEmpty();
}
```

Then an integration test over real HTTP and real PostgreSQL, modelled on
`DepartmentsEndpointsTests` — including the two-tenant test that proves isolation survives
the whole stack, not just the `DbContext`.

```bash
make test-unit
make test-integration
```

### 9. Frontend: `/me` for the employee shell, list/create for admin

```typescript
// features/employees/api/employees-api.ts
import { api } from '@/lib/api-client';

export interface Employee {
  id: string;
  fullName: string;
  employeeNumber: string;
  workEmail: string;
}

export function getCurrentEmployee(signal?: AbortSignal): Promise<Employee> {
  return api.get<Employee>('/api/employees/me', { signal });
}
```

The only file that knows the URL. Types are hand-written to match the server's response
records.

```typescript
// features/employees/api/employees-queries.ts
export const employeeKeys = {
  all: ['employees'] as const,
  current: () => [...employeeKeys.all, 'current'] as const,
};

export function useCurrentEmployee() {
  return useQuery<Employee, ApiError>({
    queryKey: employeeKeys.current(),
    queryFn: ({ signal }) => getCurrentEmployee(signal),
  });
}
```

The employee shell, Continue (employee card), and Profile read this. The admin directory
uses `listEmployees` / `createEmployee` in the same feature folder — still no People item
on the employee nav.

Mock `../api/employees-api` in tests — the network boundary — never the query hooks.

```bash
npm run test:run
```

---

## List and create slices (leave, punches, …)

Copy `Departments` in the repo. Same layers: entity, EF config, `DbSet`, migration, one
file per use case, `AsNoTracking()` + `Select` on reads, interceptor stamps `TenantId` on
writes, isolation test with two tenants, feature `*-api.ts` + key factory, page owns
loading / error / empty / populated.

Do not add a nav item unless the mock already has one. Employee shell: Home, Time off,
Inbox. Admin shell: Dashboard, Employees, Approvals, Organization.

---

## Before opening the pull request

```bash
make lint          # eslint, tsc, dotnet format
make test          # backend unit + frontend
make test-integration
```

Then check:

- [ ] The entity implements `ITenantScoped` (unless it genuinely is not tenant-owned).
- [ ] A test proves two tenants cannot see each other's rows.
- [ ] Unique indexes lead with `TenantId`.
- [ ] The migration's generated SQL was read, not just generated.
- [ ] No endpoint returns an entity — responses are records.
- [ ] Reads use `AsNoTracking()` and project with `Select`.
- [ ] Every async method takes and passes a `CancellationToken`.
- [ ] The frontend page handles loading, error, empty, and populated.
- [ ] Query keys come from the feature's key factory.
- [ ] Inputs have labels; errors have `role="alert"`.
- [ ] Nothing was added to `Program.cs`.
- [ ] The employee shell is still Home / Time off / Inbox — no People item there.
- [ ] Admin list/create/update and approvals do not leak into the employee chrome.
- [ ] `GET /me` still resolves Akram when the tenant has more than one employee.
