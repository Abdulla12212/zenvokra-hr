# Cloudesh HR

Multi-tenant HR SaaS aimed at small companies (roughly 5–10 employees per tenant). The
foundation is a containerized .NET 10 Minimal API, a React 19 SPA, PostgreSQL with EF Core,
and tenant isolation wired through the data layer. Platform admins can already onboard
companies and tenant admins.

| Layer    | Stack                                                                     |
| -------- | ------------------------------------------------------------------------- |
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS v4, shadcn/ui, TanStack Query |
| Backend  | .NET 10 Minimal API, vertical slice architecture, EF Core 10              |
| Database | PostgreSQL 18                                                             |
| Local    | Docker Compose (api, web, postgres)                                       |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.30+ (includes Compose v2)
- GNU Make (preinstalled on macOS and Linux)

That is all you need — the .NET SDK and Node.js run inside containers. If you prefer to work
outside Docker, see [Running without Docker](#running-without-docker).

## First run

```bash
cp .env.example .env
make up
```

The API container restores packages, applies EF Core migrations, seeds the platform admin, and
starts `dotnet watch`. The web container installs npm packages and starts Vite. The first run
takes a few minutes; subsequent runs are fast because both `node_modules` and the NuGet cache
live in named volumes.

Sign in at http://localhost:5173 with `owner@cloudesh.test` / `cloudesh-dev` (see `.env.example`).

| Service       | URL                                    |
| ------------- | -------------------------------------- |
| Web app       | http://localhost:5173                  |
| API           | http://localhost:8080                  |
| Health check  | http://localhost:8080/health (live), /health/ready (database) |

Both containers hot-reload on file changes. Run `make help` to see every available target.

### Verify the backend on first run

The frontend was built, linted, type-checked, and tested when this boilerplate was generated. The
backend was not: the generating machine had no .NET SDK, so `make up` is the first time the C#
compiles and the first time the hand-written initial migration meets a real database. Expect to
fix a stray `using` if something is off.

Once the stack is up, confirm the migration matches the model:

```bash
make up
docker compose exec api dotnet ef migrations has-pending-model-changes \
  -p src/Cloudesh.Application -s src/Cloudesh.Api
```

If that reports pending changes, regenerate it from scratch — the model is the source of truth and
there is no production data to preserve:

```bash
make clean          # drop the database volume
make migrate-reset  # delete and regenerate Migrations/ from the current model
make up
```

## Project layout

```
├── backend/
│   ├── Cloudesh.slnx
│   ├── Directory.Build.props        # shared compiler settings for every project
│   ├── Directory.Packages.props     # every NuGet version, pinned in one place
│   ├── src/
│   │   ├── Cloudesh.Api/            # host: Program.cs, config, Dockerfile
│   │   └── Cloudesh.Application/    # features, domain, infrastructure
│   │       ├── Common/              # cross-cutting primitives
│   │       ├── Domain/              # entities
│   │       ├── Features/            # one folder per feature (vertical slices)
│   │       └── Infrastructure/      # persistence + tenancy
│   └── tests/
│       ├── Cloudesh.UnitTests/
│       └── Cloudesh.IntegrationTests/
├── frontend/
│   └── src/
│       ├── app/                     # providers, router, layout
│       ├── components/ui/           # shadcn/ui primitives
│       ├── features/                # mirrors backend Features/
│       └── lib/                     # api client, utilities
├── docs/                            # architecture + coding conventions
└── docker-compose.yml               # + docker-compose.override.yml for dev
```

`frontend/src/features/<name>/` intentionally mirrors
`backend/src/Cloudesh.Application/Features/<Name>/`, so a single feature maps to two predictable
folders on both sides of the wire.

## Documentation

Read these before writing code — they are also what AI agents load automatically via
[`AGENTS.md`](AGENTS.md) and `.cursor/rules/`.

| Document                                                             | Purpose                                                        |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                         | How the system fits together, and the roadmap of what comes next |
| [docs/ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md)                       | Step-by-step recipe for one feature, back to front             |
| [docs/CODING-CONVENTIONS-DOTNET.md](docs/CODING-CONVENTIONS-DOTNET.md) | Backend standards                                            |
| [docs/CODING-CONVENTIONS-REACT.md](docs/CODING-CONVENTIONS-REACT.md) | Frontend standards                                             |
| [docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)                       | Render web service + Neon Postgres                             |

## Multi-tenancy in one paragraph

Every tenant-scoped entity implements `ITenantScoped` and carries a `TenantId` column. EF Core
applies a named query filter called `TenantIsolation` to those entities automatically, so reads can
never see another tenant's rows, and a `SaveChanges` interceptor stamps `TenantId` on inserts and
rejects cross-tenant updates and deletes. The current tenant comes from `ITenantContext`.

The current tenant comes from the signed session cookie via `ITenantContext`. Platform admins
have no tenant; tenant admins carry a `tenant_id` claim. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Common tasks

```bash
make up                              # start everything
make logs                            # tail logs
make down                            # stop, keep data
make clean                           # stop and delete the database volume
make psql                            # psql shell on the dev database
make test                            # backend + frontend tests
make lint                            # ESLint, tsc, and dotnet format
make migrate-add NAME=AddEmployees   # create a migration
make migrate                         # apply pending migrations
```

## What exists today

Platform admins can sign in, create companies, and create tenant admins. Tenant admins can
sign in to a stub company workspace. Copy `Features/Auth` and `Features/PlatformTenants`
when adding the next module — see [docs/ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md).

## Running without Docker

You need the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) and
[Node.js 24+](https://nodejs.org). Postgres still runs in Docker:

```bash
docker compose up -d postgres

# Backend, from ./backend
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=cloudesh_hr;Username=cloudesh;Password=cloudesh_dev_password"
dotnet watch --project src/Cloudesh.Api

# Frontend, from ./frontend
npm install
npm run dev
```

## Troubleshooting

**Port already in use.** Override the port in `.env` (`API_PORT`, `WEB_PORT`, `POSTGRES_PORT`)
and run `make up` again.

**API exits with a connection failure.** Postgres was not ready. Compose gates the API on the
Postgres health check, so this usually means the volume is in a bad state: `make clean && make up`.

**Frontend cannot reach the API.** In Compose, Vite proxies `/api` to `http://api:8080`; leave
`VITE_API_BASE_URL` empty so the proxy is used. Only set it when pointing a browser at a deployed
API.

**`node_modules` looks stale after changing `package.json`.** It lives in a named volume:
`docker compose down -v web && make up`.

**Slow hot reload on macOS.** Bind mounts are slow on Docker Desktop for macOS. Use
[Running without Docker](#running-without-docker) for a faster loop.

## Deploying to Render + Neon

The production image is one origin: the API serves the built SPA, so cookies stay
same-site. Postgres lives on Neon. Walkthrough: [docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md).

```bash
# Preview the image Render will build
make build-deploy
```

[`render.yaml`](render.yaml) is the Blueprint. Create a Neon project in the same
region, paste `DATABASE_URL` plus the platform-admin email and password when Render
asks, and keep a single instance while `Database__MigrateOnStartup` is on.
