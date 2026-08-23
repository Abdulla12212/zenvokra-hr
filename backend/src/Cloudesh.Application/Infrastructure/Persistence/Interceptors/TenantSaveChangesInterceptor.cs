using Cloudesh.Application.Domain.Common;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Cloudesh.Application.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Enforces tenant ownership on writes.
/// </summary>
/// <remarks>
/// Query filters only apply to reads, so without this interceptor a caller who
/// guessed another tenant's primary key could update or delete that row. Every
/// tracked <see cref="ITenantScoped"/> entity is checked before the save reaches the
/// database:
/// <list type="bullet">
///   <item><description>Inserts with no tenant get the current one stamped on.</description></item>
///   <item><description>Inserts naming a different tenant are rejected.</description></item>
///   <item><description>Updates and deletes of another tenant's row are rejected.</description></item>
///   <item><description>Moving a row between tenants is rejected.</description></item>
/// </list>
/// When no tenant is resolved at all — seeding, migrations, background work — the
/// interceptor stays out of the way, but still refuses an insert that has no tenant,
/// because such a row would be invisible to every reader.
/// </remarks>
public sealed class TenantSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly ITenantContext _tenantContext;

    public TenantSaveChangesInterceptor(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        Enforce(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Enforce(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void Enforce(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        Guid? currentTenantId = _tenantContext.TenantId;

        foreach (var entry in context.ChangeTracker.Entries<ITenantScoped>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    StampOrReject(entry.Entity, currentTenantId);
                    break;

                case EntityState.Modified:
                    RejectCrossTenant(entry.Entity, currentTenantId);
                    RejectTenantReassignment(entry);
                    break;

                case EntityState.Deleted:
                    RejectCrossTenant(entry.Entity, currentTenantId);
                    break;

                default:
                    break;
            }
        }
    }

    private static void StampOrReject(ITenantScoped entity, Guid? currentTenantId)
    {
        if (entity.TenantId == Guid.Empty)
        {
            entity.TenantId = currentTenantId
                ?? throw new TenantNotResolvedException(
                    $"Cannot insert '{entity.GetType().Name}': it has no tenant and none is in scope. " +
                    "Inside a request the tenant is resolved automatically; outside one, wrap the work in " +
                    "ITenantScopeFactory.BeginScope or assign TenantId explicitly.");
            return;
        }

        RejectCrossTenant(entity, currentTenantId);
    }

    private static void RejectCrossTenant(ITenantScoped entity, Guid? currentTenantId)
    {
        if (currentTenantId is not null && entity.TenantId != currentTenantId)
        {
            throw CrossTenantOperationException.For(entity.GetType().Name, entity.TenantId, currentTenantId);
        }
    }

    private static void RejectTenantReassignment(EntityEntry<ITenantScoped> entry)
    {
        if (entry.Property(entity => entity.TenantId).IsModified)
        {
            throw new CrossTenantOperationException(
                $"Refusing to move '{entry.Entity.GetType().Name}' to a different tenant. " +
                "Tenant ownership is immutable once a row exists.");
        }
    }
}
