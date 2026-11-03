using Zenvokra.Application.Domain.Common;

namespace Zenvokra.Application.Domain.Tenants;

/// <summary>
/// A customer of the platform: one company, with its own isolated data.
/// </summary>
/// <remarks>
/// Deliberately <em>not</em> <see cref="ITenantScoped"/> — this is the tenant
/// registry, so it lives outside tenant isolation. Only platform-level code should
/// query it, and it must never be exposed through a tenant-facing endpoint.
/// </remarks>
public sealed class Tenant : IAuditable
{
    /// <summary>Time-ordered UUIDv7, assigned by the caller. See <see cref="Create"/>.</summary>
    public Guid Id { get; set; }

    /// <summary>Company name as the customer would write it.</summary>
    public required string Name { get; set; }

    /// <summary>URL-safe identifier, unique across the platform (for example <c>acme-consulting</c>).</summary>
    public required string Slug { get; set; }

    /// <summary>
    /// Whether the tenant may use the platform. Suspending a non-paying customer
    /// should flip this rather than delete their data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static Tenant Create(string name, string slug) => new()
    {
        Id = Guid.CreateVersion7(),
        Name = name,
        Slug = slug,
    };
}
