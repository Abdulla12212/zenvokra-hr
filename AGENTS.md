# Cloudesh HR

Multi-tenant HR SaaS for small companies. Three signed-in roles: platform admin
(companies), tenant admin (Dashboard / Employees / Approvals / Organization), and
employee (Home / Time off / Inbox). Employees punch, request time off, and read a
derived inbox. Tenant admins review leave and punch corrections on Approvals,
read a presence Dashboard, and edit a tenant-scoped Organization profile.

.NET 10 Minimal API (vertical slices) + EF Core 10 + PostgreSQL 18, with a React 19 + Vite
+ Tailwind SPA. Everything runs in Docker Compose.

## Read before writing code

| Document                                                             | When                              |
| -------------------------------------------------------------------- | --------------------------------- |
| [docs/ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md)                       | Adding any feature — start here   |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                         | Deciding where something belongs  |
| [docs/CODING-CONVENTIONS-DOTNET.md](docs/CODING-CONVENTIONS-DOTNET.md) | Touching `backend/`             |
| [docs/CODING-CONVENTIONS-REACT.md](docs/CODING-CONVENTIONS-REACT.md) | Touching `frontend/`              |
| [docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)                       | Deploying to Render + Neon        |

## The rules that matter most

**Tenant isolation.** Every entity implements `ITenantScoped`, and EF Core's
`TenantIsolation` query filter plus `TenantSaveChangesInterceptor` do the rest.

- Never write `.Where(x => x.TenantId == ...)` — the filter already does.
- Never set `TenantId` on insert — the interceptor stamps it.
- Never call bare `IgnoreQueryFilters()` — name the filter you mean to disable.
- Every feature needs a test proving two tenants cannot see each other's rows.

**Vertical slices.** One use case per file under `Features/<Feature>/`. Endpoint groups are
discovered by assembly scan, so **never add feature wiring to `Program.cs`**.

**No repositories.** Handlers use `AppDbContext` directly. Reads use `AsNoTracking()` and
project with `Select`. Every async method takes and passes a `CancellationToken`.

**Never return an entity from an endpoint.** Responses are `record` types declared in the
slice.

**Server state belongs to TanStack Query.** Never `useEffect` + `fetch`, never server data
in `useState`, never `fetch` outside `lib/api-client.ts`. Query keys come from the
feature's key factory.

**No `any` and no `!` in TypeScript.** Both fail the lint.

## Authentication and tenancy

The tenant comes from the signed session cookie, in one method:
`TenantContext.ResolveFromRequest`. Platform admins have no tenant. Tenant admins and
employees carry a `tenant_id` claim. Do not add a second way to determine the tenant (no
`X-Tenant-Id` header, no default tenant).

Login is email + password. Emails are unique across platform admins, tenant admins, and
employee accounts. An `Employee` row is the HR record; `EmployeeAccount` is the login.
`GET /api/employees/me` is the signed-in employee (403 for tenant admins). Roster
list/create/update is tenant-admin only.

Platform-level and login endpoints declare `EndpointAudience.Platform` or
`EndpointAudience.Anonymous` so they sit outside the tenant guard. Copy
`Features/Auth` and `Features/PlatformTenants` for new slices. Tenant HR endpoints use
`EndpointAudience.Tenant` plus a role filter when only one of the two tenant roles may
call them.

Do not mix chrome. Employee nav stays Home / Time off / Inbox. Admin nav is Dashboard /
Employees / Approvals / Organization. Specs: `docs/ux-employee` and `docs/ux-admin`.

## Commands

```bash
make up                              # start postgres, api, web
make lint                            # eslint, tsc, dotnet format
make test                            # backend unit + frontend
make test-integration                # real PostgreSQL via Testcontainers
make migrate-add NAME=AddEmployees   # create a migration
```

Docker is the only prerequisite; the .NET SDK and Node run inside containers.

## Versions are pinned deliberately

- **TypeScript is 6.0.3, not 7.x.** TypeScript 7 ships no programmatic compiler API until
  7.1, so `typescript-eslint` declares `peer typescript <6.1.0` and crashes against it. Do
  not upgrade until typescript-eslint supports it.
- `tsconfig.json` has no `baseUrl` on purpose — TypeScript 7 removes it, and `paths`
  resolves relative to the config file without it.
- Backend package versions live only in `backend/Directory.Packages.props`; `.csproj` files
  reference packages without a version.
