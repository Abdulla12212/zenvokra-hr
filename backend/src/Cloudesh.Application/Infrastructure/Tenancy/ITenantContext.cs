namespace Cloudesh.Application.Infrastructure.Tenancy;

/// <summary>
/// The tenant the current unit of work belongs to.
/// </summary>
/// <remarks>
/// Registered as scoped, so within one HTTP request every consumer — including
/// <c>AppDbContext</c> — sees the same tenant.
/// </remarks>
public interface ITenantContext
{
    /// <summary>Current tenant, or <see langword="null"/> outside a tenant context (migrations, seeding, background work).</summary>
    Guid? TenantId { get; }

    /// <summary>Whether a tenant has been resolved.</summary>
    bool HasTenant => TenantId.HasValue;

    /// <summary>
    /// The current tenant, or <see cref="Guid.Empty"/> when none is resolved.
    /// </summary>
    /// <remarks>
    /// Exists so the EF Core query filter always compares against a non-null
    /// parameter: an unresolved tenant then matches zero rows instead of depending
    /// on SQL NULL semantics. Feature code should use <see cref="RequireTenantId"/>
    /// instead — a silent empty result set is a bad way to learn that tenant
    /// resolution failed.
    /// </remarks>
    Guid FilterTenantId => TenantId ?? Guid.Empty;

    /// <summary>Returns the current tenant, or throws when there is none.</summary>
    /// <exception cref="TenantNotResolvedException">No tenant could be resolved.</exception>
    Guid RequireTenantId();
}

/// <summary>
/// Runs a block of work as a specific tenant.
/// </summary>
/// <remarks>
/// Intended for code that has no request to resolve a tenant from: database
/// seeding, migrations, and (later) background jobs and scheduled tasks. Do not
/// inject this into a feature handler — a handler that chooses its own tenant has
/// defeated the isolation model.
/// </remarks>
public interface ITenantScopeFactory
{
    /// <summary>Makes <paramref name="tenantId"/> the current tenant until the returned scope is disposed.</summary>
    IDisposable BeginScope(Guid tenantId);
}
