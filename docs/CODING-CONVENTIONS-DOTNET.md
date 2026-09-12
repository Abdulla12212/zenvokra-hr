# Backend coding conventions

Rules for `backend/`. Every rule includes why it exists, because a rule whose reason is
unknown gets worked around rather than followed.

The compiler and `.editorconfig` already enforce formatting and naming. This document
covers the decisions they cannot.

**Roles.** `GET /api/employees/me` is the signed-in employee (`EmployeeAccount` →
`Employee`). List, create, and update employees are tenant-admin slices. Do not prefer a
demo employee number. Isolation tests still use a second tenant — that tenant is not a
product surface.

---

## Where code goes

| Kind of code                                | Location                                                  |
| ------------------------------------------- | --------------------------------------------------------- |
| An HTTP operation and its logic             | `Features/<Feature>/<UseCase>.cs`                          |
| Routes for a feature                        | `Features/<Feature>/<Feature>Endpoints.cs`                 |
| An entity                                   | `Domain/<Feature>/<Entity>.cs`                             |
| EF mapping for an entity                    | `Infrastructure/Persistence/Configurations/<Entity>Configuration.cs` |
| Something three or more features need       | `Common/`                                                  |
| Host wiring                                 | `Cloudesh.Api/` — and almost never                         |

**One slice per use case, one file per slice.** `ListDepartments` and `CreateDepartment`
are separate files even though both are about departments. They change for different
reasons, they have different request and response shapes, and merging them produces a file
that everyone edits and nobody owns.

**Never add to `Program.cs` for a feature.** Endpoint groups are discovered by assembly
scan. If a feature needs central wiring, that is a signal the abstraction is missing, not
that `Program.cs` should grow.

**The rule of three for `Common/`.** Extract shared code when a third feature needs it.
Two features sharing an abstraction built for one of them is how unrelated things become
coupled.

---

## Feature slices

A slice is a static class holding its request, its response, and its handler:

```csharp
public static class CreateDepartment
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; init; } = string.Empty;
    }

    public sealed record Response(Guid Id, string Name, DateTimeOffset CreatedAtUtc);

    public static async Task<Results<Created<Response>, ProblemHttpResult>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        // ...
    }
}
```

- **Requests and responses are `sealed record`s nested in the slice.** Nesting means
  `CreateDepartment.Request` reads unambiguously and two slices can each have a `Request`
  without inventing names like `CreateDepartmentRequestDto`.
- **Request records use init-only properties with defaults, not positional parameters.**
  A positional record with `required` members fails JSON deserialization with an opaque
  message when a field is missing; a property with a default reaches validation and fails
  with a field-level message the form can render.
- **Never return an entity from an endpoint.** A response record is an API contract; an
  entity is a storage detail. Returning the entity makes every schema change a breaking
  API change, and leaks columns nobody meant to publish.
- **Handlers are `static`** and take their dependencies as parameters. Minimal API injects
  them, so there is no constructor, no field, and nothing to mock that is not visible in
  the signature.
- **Return a `TypedResults` union**, such as `Results<Ok<T>, NotFound>`. The return type
  documents every possible outcome without a single `[ProducesResponseType]`.

### Validation

Data annotations on the request record. `AddValidation()` runs them before the handler,
and a failure becomes a 400 with a per-field `errors` object.

Validation is for *shape* — required, length, range, format. Business rules that need the
database (does this name already exist, is this leave request within the person's balance)
belong in the handler, because a validator that queries is a handler wearing a disguise.

---

## Data access

**Use `AppDbContext` directly. There is no repository layer.** `DbSet<T>` already
abstracts the database. A repository over it either exposes `IQueryable` — achieving
nothing but indirection — or hides it and then blocks every query shape it did not
anticipate.

### Query rules

```csharp
// ✅ Read-only query: no tracking, projected in the database.
List<DepartmentSummary> items = await dbContext.Departments
    .AsNoTracking()
    .OrderBy(department => department.Name)
    .Select(department => new DepartmentSummary(department.Id, department.Name))
    .ToListAsync(cancellationToken);

// ❌ Materializes whole entities, tracks them for no reason, maps in memory.
var departments = await dbContext.Departments.ToListAsync(cancellationToken);
return departments.Select(d => new DepartmentSummary(d.Id, d.Name)).ToList();
```

- **`AsNoTracking()` on every read that does not lead to a save.** The change tracker
  costs memory and time to snapshot entities nothing will modify.
- **Project with `Select` before materializing.** Only the needed columns cross the wire,
  and the projection is a contract the compiler checks.
- **Always pass `CancellationToken`.** When a client disconnects, the query should stop.
  Every async method takes one and passes it down.
- **Never write `.Where(x => x.TenantId == ...)`.** The query filter does it. Writing it
  by hand is redundant and suggests to the next reader that it is sometimes optional.
- **Order before paginating.** An unordered `Skip`/`Take` returns arbitrary rows, and can
  return the same row on two different pages.
- **Watch for N+1.** A `Select` that navigates a collection per row becomes one query per
  row. Check the SQL in the logs — `Microsoft.EntityFrameworkCore.Database.Command` is at
  `Information` in development for exactly this.

### Writes

```csharp
var department = Department.Create(name);  // assigns a UUIDv7 id
dbContext.Departments.Add(department);
await dbContext.SaveChangesAsync(cancellationToken);
```

- **Leave `TenantId` unset.** `TenantSaveChangesInterceptor` stamps it and refuses
  anything cross-tenant. Setting it by hand is at best redundant and at worst a bug.
- **Never set `CreatedAtUtc` or `UpdatedAtUtc`.** The audit interceptor owns them.
- **Ids come from a static `Create` factory** on the entity, using
  `Guid.CreateVersion7()`. Time-ordered keys keep inserts at the right edge of the index,
  and the id exists before the row is saved.
- **One `SaveChangesAsync` per request** where possible. It is a transaction; two calls
  are two transactions, and the second can fail leaving the first committed.

### Entities

- Plain classes with settable properties. No EF attributes — mapping lives in an
  `IEntityTypeConfiguration<T>`, so the domain type does not depend on the ORM.
- `required` for values that must always exist; the compiler then enforces it at every
  construction site.
- **Implement `ITenantScoped` unless the entity genuinely is not tenant-owned.** The
  exceptions are the tenant registry itself and global reference data such as countries or
  currencies. When in doubt, implement it: a wrongly isolated entity is a bug you find in
  a minute, and a wrongly shared one is a data breach you find in a year.
- Implement `IAuditable` for anything a human edits.

### Migrations

```bash
make migrate-add NAME=AddEmployees   # generate
make migrate                          # apply
```

- **Never hand-edit a generated migration's model snapshot.** Change the model and
  regenerate.
- **Review the generated SQL before committing.** EF occasionally produces a destructive
  operation — a column rename that becomes drop-and-add — and loses data doing it.
- **One migration per pull request**, named for what it does.
- **Never edit a migration that has run anywhere but your own machine.** Write a new one.

---

## Async and errors

- **Async all the way down.** No `.Result`, no `.Wait()`, no `.GetAwaiter().GetResult()`.
  Blocking on async work under load exhausts the thread pool, and the failure looks like a
  mysterious hang rather than an error.
- **`CancellationToken` is a parameter on every async method,** and it gets passed on.
- **Exceptions are for the unexpected.** A department that already exists is an expected
  outcome: return `TypedResults.Problem(..., StatusCodes.Status409Conflict)`. Throwing for
  control flow is slow and hides intent.
- **Never swallow an exception.** No empty `catch`. If there is genuinely nothing to do,
  log at warning and say in a comment why continuing is correct.
- **New exception types get mapped** in `GlobalExceptionHandler`. An unmapped exception is
  a 500, which tells the client nothing and the log everything.

---

## Dependency injection

- **Scoped** for anything that holds per-request state: `AppDbContext`, `TenantContext`,
  interceptors.
- **Singleton** for stateless services and `TimeProvider`.
- **Never resolve a scoped service from the root provider.** It either throws or, worse,
  leaks a `DbContext` for the lifetime of the process. Use `CreateAsyncScope()` in startup
  code — see `WebApplicationExtensions.InitializeDatabaseAsync`.
- **Inject `TimeProvider`, never call `DateTimeOffset.UtcNow`.** Time-dependent behaviour
  that cannot be controlled cannot be tested, and accrual and payroll are full of it.

---

## Tests

Unit tests in `Cloudesh.UnitTests` (SQLite, milliseconds, no Docker); integration tests in
`Cloudesh.IntegrationTests` (real PostgreSQL via Testcontainers, real DI graph, real HTTP).

- **Name tests as sentences:** `Insert_is_refused_when_no_tenant_is_resolved`. A failing
  test name should describe the broken behaviour without opening the file.
- **Every feature gets a tenant-isolation test.** Two tenants, and neither sees the other's
  data. This is the test that matters most and the one easiest to forget.
- **Never use `EnsureCreated` in a test that is about schema.** It bypasses migrations,
  so it proves nothing about what production will run. Integration tests migrate.
- **Assert on behaviour, not implementation.** That a handler called `SaveChangesAsync` is
  not interesting; that the row is in the database afterwards is.
- **Mock almost nothing.** SQLite and Testcontainers are fast enough that a fake adds risk
  without buying speed. `TimeProvider` is the exception worth faking.

---

## Forbidden patterns

Each of these has caused a production incident somewhere, which is why it is on the list.

| Never                                                    | Instead                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`          | `await`                                                              |
| `async void`                                              | `async Task`                                                         |
| `IgnoreQueryFilters()` with no arguments                   | `IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])`, with a comment |
| Manual `.Where(x => x.TenantId == ...)`                    | Nothing; the query filter handles it                                 |
| Returning an entity from an endpoint                      | A response record                                                    |
| `DateTimeOffset.UtcNow` / `DateTime.Now`                   | An injected `TimeProvider`                                           |
| `DateTime` for a stored timestamp                          | `DateTimeOffset`, always UTC                                         |
| String-concatenated SQL                                   | LINQ, or `FromSql` with interpolated parameters                       |
| A new repository or generic service layer                 | `AppDbContext` in the handler                                        |
| Registering feature services in `Program.cs`               | `IEndpointGroup` and constructor injection                            |
| An empty `catch`                                          | Handle it, or let it reach `GlobalExceptionHandler`                   |
| `Guid.NewGuid()` for a primary key                        | `Guid.CreateVersion7()`                                              |
| Secrets in `appsettings.json`                             | Environment variables or user secrets                                |
| `IgnoreQueryFilters` in a seeder                          | `ITenantScopeFactory.BeginScope`                                      |
