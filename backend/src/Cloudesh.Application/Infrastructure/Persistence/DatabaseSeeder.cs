using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Creates the demo tenant and some sample data so a fresh clone has something to
/// show. Idempotent: safe to run on every start.
/// </summary>
/// <remarks>
/// Real reference data that every tenant needs (leave types, holiday calendars,
/// countries) does not belong here — that is what migrations with
/// <c>HasData</c> or a dedicated reference-data migration are for. This seeder is
/// only for local convenience.
/// </remarks>
public sealed class DatabaseSeeder
{
    private static readonly string[] SampleDepartments = ["Engineering", "People Operations", "Finance"];

    private readonly AppDbContext _dbContext;
    private readonly ITenantScopeFactory _tenantScopes;
    private readonly TenancyOptions _tenancyOptions;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        AppDbContext dbContext,
        ITenantScopeFactory tenantScopes,
        IOptions<TenancyOptions> tenancyOptions,
        ILogger<DatabaseSeeder> logger)
    {
        _dbContext = dbContext;
        _tenantScopes = tenantScopes;
        _tenancyOptions = tenancyOptions.Value;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (_tenancyOptions.DefaultTenantId is not Guid tenantId)
        {
            _logger.LogInformation(
                "Skipping seed: Tenancy:DefaultTenantId is not configured, so there is no tenant to seed into.");
            return;
        }

        await SeedTenantAsync(tenantId, cancellationToken);

        // Departments are tenant-scoped, and seeding runs outside any request, so the
        // tenant has to be supplied explicitly for the query filter and the write
        // interceptor to work.
        using (_tenantScopes.BeginScope(tenantId))
        {
            await SeedEmployeeAsync(cancellationToken);
            await SeedDepartmentsAsync(cancellationToken);
        }
    }

    private async Task SeedTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        bool exists = await _dbContext.Tenants
            .AnyAsync(tenant => tenant.Id == tenantId, cancellationToken);

        if (exists)
        {
            return;
        }

        _dbContext.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "Acme Consulting",
            Slug = "acme-consulting",
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo tenant {TenantId}.", tenantId);
    }

    private async Task SeedEmployeeAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.Employees.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.Employees.Add(Employee.Create(
            "Akram Hossain",
            "EMP-1024",
            "akram.hossain@acmeconsulting.test"));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded demo employee EMP-1024.");
    }

    // WALKING SKELETON: delete alongside the Departments feature.
    private async Task SeedDepartmentsAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.Departments.AnyAsync(cancellationToken))
        {
            return;
        }

        _dbContext.Departments.AddRange(SampleDepartments.Select(Department.Create));

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} sample departments.", SampleDepartments.Length);
    }
}
