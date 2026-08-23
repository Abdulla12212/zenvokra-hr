namespace Cloudesh.Application.Domain.Common;

/// <summary>
/// Marks an entity whose creation and last-modification timestamps are maintained
/// automatically by <c>AuditableSaveChangesInterceptor</c>.
/// </summary>
/// <remarks>
/// Never assign these properties by hand; the interceptor overwrites them on every
/// save. When the audit trail needs to record <em>who</em> changed a row and not
/// just when, extend this with <c>CreatedBy</c>/<c>UpdatedBy</c> once authentication
/// exists — see the roadmap in docs/ARCHITECTURE.md.
/// </remarks>
public interface IAuditable
{
    /// <summary>When the row was inserted. Always UTC.</summary>
    DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>When the row was last updated, equal to <see cref="CreatedAtUtc"/> for rows that have never changed. Always UTC.</summary>
    DateTimeOffset UpdatedAtUtc { get; set; }
}
