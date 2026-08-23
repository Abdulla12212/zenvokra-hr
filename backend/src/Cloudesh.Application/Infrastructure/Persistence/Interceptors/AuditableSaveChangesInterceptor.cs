using Cloudesh.Application.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Cloudesh.Application.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Maintains <see cref="IAuditable"/> timestamps so no handler has to remember to.
/// </summary>
/// <remarks>
/// Time comes from an injected <see cref="TimeProvider"/> rather than
/// <c>DateTimeOffset.UtcNow</c>, which keeps time-dependent behaviour testable.
/// </remarks>
public sealed class AuditableSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly TimeProvider _timeProvider;

    public AuditableSaveChangesInterceptor(TimeProvider timeProvider)
    {
        _timeProvider = timeProvider;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void Stamp(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        foreach (var entry in context.ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAtUtc = now;
                    entry.Entity.UpdatedAtUtc = now;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAtUtc = now;
                    // A client must never be able to rewrite history.
                    entry.Property(entity => entity.CreatedAtUtc).IsModified = false;
                    break;

                default:
                    break;
            }
        }
    }
}
