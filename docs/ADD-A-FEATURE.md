# Adding a feature

One walkthrough, front to back, using a hypothetical `Employees` feature. The shipped
`Departments` feature is the same shape and is the reference to copy from — every file
involved is marked `WALKING SKELETON`.

Read [CODING-CONVENTIONS-DOTNET.md](CODING-CONVENTIONS-DOTNET.md) and
[CODING-CONVENTIONS-REACT.md](CODING-CONVENTIONS-REACT.md) first; this document is the
sequence, not the rules.

## The files a feature touches

```
backend/src/Cloudesh.Application/
├── Domain/Employees/Employee.cs
├── Infrastructure/Persistence/Configurations/EmployeeConfiguration.cs
├── Infrastructure/Persistence/AppDbContext.cs          (+1 DbSet)
├── Features/Employees/EmployeeEndpoints.cs
├── Features/Employees/ListEmployees.cs
├── Features/Employees/CreateEmployee.cs
└── Migrations/                                          (generated)

backend/tests/
├── Cloudesh.UnitTests/Persistence/EmployeeTenantIsolationTests.cs
└── Cloudesh.IntegrationTests/EmployeesEndpointsTests.cs

frontend/src/
├── features/employees/api/employees-api.ts
├── features/employees/api/employees-queries.ts
├── features/employees/components/employee-table.tsx
├── features/employees/pages/employees-page.tsx
├── features/employees/pages/employees-page.test.tsx
├── app/router.tsx                                       (+1 route)
└── app/layout/app-shell.tsx                             (+1 nav item)
```

Nine new files, three edited. Nothing in `Program.cs`, and nothing in `Common/`.

---

## Backend

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
    public required string WorkEmail { get; set; }
    public Guid? DepartmentId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static Employee Create(string fullName, string workEmail) => new()
    {
        Id = Guid.CreateVersion7(),
        FullName = fullName,
        WorkEmail = workEmail,
    };
}
```

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
        builder.Property(employee => employee.WorkEmail).HasMaxLength(320).IsRequired();

        // Lead with TenantId: it matches how every query filters, and doubles as the
        // index EF would otherwise create for the tenant foreign key.
        builder.HasIndex(employee => new { employee.TenantId, employee.WorkEmail }).IsUnique();

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

### 5. The read slice

```csharp
// Features/Employees/ListEmployees.cs
public static class ListEmployees
{
    public sealed record EmployeeSummary(Guid Id, string FullName, string WorkEmail);

    public static async Task<Ok<PagedResult<EmployeeSummary>>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = PagedResult<EmployeeSummary>.DefaultPageSize)
    {
        int pageNumber = PagedResult<EmployeeSummary>.NormalizePage(page);
        int size = PagedResult<EmployeeSummary>.NormalizePageSize(pageSize);

        var query = dbContext.Employees.AsNoTracking();

        int totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(employee => employee.FullName)
            .Skip((pageNumber - 1) * size)
            .Take(size)
            .Select(employee => new EmployeeSummary(employee.Id, employee.FullName, employee.WorkEmail))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok(new PagedResult<EmployeeSummary>(items, pageNumber, size, totalCount));
    }
}
```

No tenant filter. That is not an omission — the query filter adds it, and writing it here
would suggest to the next reader that it is sometimes optional.

### 6. The write slice

```csharp
// Features/Employees/CreateEmployee.cs
public static class CreateEmployee
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string FullName { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [EmailAddress]
        [StringLength(320)]
        public string WorkEmail { get; init; } = string.Empty;
    }

    public sealed record Response(Guid Id, string FullName, string WorkEmail);

    public static async Task<Results<Created<Response>, ProblemHttpResult>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string email = request.WorkEmail.Trim().ToLowerInvariant();

        bool taken = await dbContext.Employees
            .AnyAsync(employee => employee.WorkEmail == email, cancellationToken);

        if (taken)
        {
            return TypedResults.Problem(
                title: "Employee already exists",
                detail: $"An employee with the email '{email}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var employee = Employee.Create(request.FullName.Trim(), email);

        // TenantId left unset on purpose: the interceptor stamps it.
        dbContext.Employees.Add(employee);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created(
            $"{EndpointRegistration.ApiPrefix}/employees/{employee.Id}",
            new Response(employee.Id, employee.FullName, employee.WorkEmail));
    }
}
```

### 7. The routes

```csharp
// Features/Employees/EmployeeEndpoints.cs
public sealed class EmployeeEndpoints : IEndpointGroup
{
    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        var employees = routes.MapGroup("/employees").WithTags("Employees");

        employees.MapGet("", ListEmployees.HandleAsync)
            .WithName(nameof(ListEmployees))
            .WithSummary("Lists the current tenant's employees.");

        employees.MapPost("", CreateEmployee.HandleAsync)
            .WithName(nameof(CreateEmployee))
            .WithSummary("Creates an employee.");
    }
}
```

Discovered by assembly scan. `Program.cs` is not touched, which also means two features
added in parallel never conflict over it.

### 8. Backend tests

An isolation test is not optional — it is the one test whose absence can turn into a data
breach:

```csharp
[Fact]
public async Task Employees_are_invisible_to_other_tenants()
{
    await using var fixture = await SqliteDbContextFixture.CreateAsync();

    Guid acme = await fixture.AddTenantAsync("acme");
    Guid globex = await fixture.AddTenantAsync("globex");

    using (fixture.TenantContext.BeginScope(globex))
    {
        fixture.DbContext.Employees.Add(Employee.Create("Not Yours", "nope@globex.test"));
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

---

## Frontend

### 9. The request functions

```typescript
// features/employees/api/employees-api.ts
import { api } from '@/lib/api-client';
import type { PagedResult } from '@/lib/paged-result';

export interface Employee {
  id: string;
  fullName: string;
  workEmail: string;
}

export interface CreateEmployeeInput {
  fullName: string;
  workEmail: string;
}

const basePath = '/api/employees';

export function listEmployees(
  params: { page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<PagedResult<Employee>> {
  return api.get<PagedResult<Employee>>(basePath, { query: params, signal });
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return api.post<Employee>(basePath, input);
}
```

The only file that knows the URL. Types are hand-written to match the server's response
records for now — generating them from the OpenAPI document is on the roadmap.

### 10. The query hooks

```typescript
// features/employees/api/employees-queries.ts
export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: ListEmployeesParams) => [...employeeKeys.all, 'list', params] as const,
};

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery<PagedResult<Employee>, ApiError>({
    queryKey: employeeKeys.list(params),
    queryFn: ({ signal }) => listEmployees(params, signal),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation<Employee, ApiError, CreateEmployeeInput>({
    mutationFn: (input) => createEmployee(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
```

### 11. The page

Own all four states. See `departments-page.tsx`:

```tsx
const { data, isPending, isError, error } = useEmployees();

if (isPending) return <LoadingState />;
if (isError) return <p role="alert">{error.message}</p>;
if (data.items.length === 0) return <EmptyState />;
return <EmployeeTable employees={data.items} />;
```

### 12. The route and navigation

```tsx
// app/router.tsx
{ path: 'employees', Component: EmployeesPage },
```

```tsx
// app/layout/app-shell.tsx
{ to: '/employees', label: 'People', icon: Users },
```

### 13. Frontend tests

Mock `../api/employees-api` — the network boundary — not the query hooks. That way the
test exercises the real hooks, the real cache invalidation, and the real component tree.
`departments-page.test.tsx` is the template.

```bash
npm run test:run
```

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
