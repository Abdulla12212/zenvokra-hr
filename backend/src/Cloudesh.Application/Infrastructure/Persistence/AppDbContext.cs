using System.Reflection;
using Cloudesh.Application.Domain.Common;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// The single database context for the application.
/// </summary>
/// <remarks>
/// Handlers depend on this type directly — there is no repository layer. See
/// docs/CODING-CONVENTIONS-DOTNET.md for why, and for the query rules that come
/// with that choice.
/// </remarks>
public sealed class AppDbContext : DbContext
{
    /// <summary>
    /// Key of the named query filter that restricts every <see cref="ITenantScoped"/>
    /// entity to the current tenant.
    /// </summary>
    /// <remarks>
    /// Named filters compose, so a future soft-delete filter can be switched off on
    /// its own with <c>IgnoreQueryFilters([QueryFilters.SoftDelete])</c> while tenant
    /// isolation stays on. Bare <c>IgnoreQueryFilters()</c> removes <em>every</em>
    /// filter, including this one.
    /// </remarks>
    public const string TenantIsolationFilter = "TenantIsolation";

    private static readonly MethodInfo ApplyTenantIsolationMethod =
        typeof(AppDbContext).GetMethod(nameof(ApplyTenantIsolation), BindingFlags.Instance | BindingFlags.NonPublic)
        ?? throw new InvalidOperationException("ApplyTenantIsolation could not be found.");

    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<User> Users => Set<User>();

    public DbSet<TenantAdmin> TenantAdmins => Set<TenantAdmin>();

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<EmployeeAccount> EmployeeAccounts => Set<EmployeeAccount>();

    /// <summary>
    /// The tenant every query is restricted to, or <see cref="Guid.Empty"/> when none is
    /// resolved.
    /// </summary>
    /// <remarks>
    /// Read by the tenant isolation query filter. EF Core compiles that expression into a
    /// delegate and re-evaluates this property on every query, passing the result as a SQL
    /// parameter — so one cached model serves every tenant. Public rather than private
    /// because the generated delegate reads it from outside this class.
    /// </remarks>
    public Guid CurrentTenantId => _tenantContext.FilterTenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        ApplyTenantIsolationToAllTenantScopedEntities(modelBuilder);
    }

    /// <summary>
    /// Tenant isolation is opt-out, not opt-in: implementing <see cref="ITenantScoped"/>
    /// is enough, and no one has to remember to configure a filter per entity.
    /// </summary>
    private void ApplyTenantIsolationToAllTenantScopedEntities(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Owned types are filtered through their owner.
            if (entityType.IsOwned() || !typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            ApplyTenantIsolationMethod
                .MakeGenericMethod(entityType.ClrType)
                .Invoke(this, [modelBuilder]);
        }
    }

    private void ApplyTenantIsolation<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantScoped
    {
        modelBuilder.Entity<TEntity>()
            .HasQueryFilter(TenantIsolationFilter, entity => entity.TenantId == CurrentTenantId);
    }
}
