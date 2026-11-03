namespace Zenvokra.Application.Domain.Common;

/// <summary>
/// Marks an entity as belonging to exactly one tenant.
/// </summary>
/// <remarks>
/// Implementing this interface is the only thing an entity has to do to become
/// tenant-isolated. <c>AppDbContext</c> discovers implementors and applies the
/// <c>TenantIsolation</c> query filter to them, and
/// <c>TenantSaveChangesInterceptor</c> stamps and guards <see cref="TenantId"/> on
/// write. Almost every entity in this application should implement it; the
/// exceptions are the tenant registry itself and genuinely global reference data
/// such as country or currency lookups.
/// </remarks>
public interface ITenantScoped
{
    /// <summary>
    /// Owning tenant. Leave this unset when creating an entity inside a request:
    /// the interceptor fills it in from the current tenant, and setting it to a
    /// different tenant is rejected.
    /// </summary>
    Guid TenantId { get; set; }
}
