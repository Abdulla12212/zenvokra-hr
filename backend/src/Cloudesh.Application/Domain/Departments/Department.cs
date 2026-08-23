using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Departments;

/// <summary>
/// WALKING SKELETON: a team or unit inside a company.
/// </summary>
/// <remarks>
/// This entity exists to prove the plumbing — tenant isolation, migrations,
/// auditing, endpoints, and the React data layer — end to end. Delete it once real
/// HR entities exist; keep the pattern it demonstrates. See docs/ADD-A-FEATURE.md.
/// </remarks>
public sealed class Department : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    /// <summary>Set automatically on insert by <c>TenantSaveChangesInterceptor</c>.</summary>
    public Guid TenantId { get; set; }

    /// <summary>Unique within a tenant.</summary>
    public required string Name { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    /// <summary>
    /// Ids are UUIDv7 rather than UUIDv4 because they are time-ordered, which keeps
    /// inserts at the right edge of the primary key index instead of scattering them
    /// across it.
    /// </summary>
    public static Department Create(string name) => new()
    {
        Id = Guid.CreateVersion7(),
        Name = name,
    };
}
