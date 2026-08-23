using System.ComponentModel.DataAnnotations;

namespace Cloudesh.Application.Infrastructure.Tenancy;

/// <summary>
/// Configuration for how the current tenant is discovered. Bound from the
/// <c>Tenancy</c> configuration section.
/// </summary>
public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    /// <summary>
    /// Request header carrying the tenant id.
    /// </summary>
    /// <remarks>
    /// A header is a stand-in until authentication lands, at which point the tenant
    /// comes from a signed token claim instead. See docs/ARCHITECTURE.md.
    /// </remarks>
    [Required]
    public string HeaderName { get; set; } = "X-Tenant-Id";

    /// <summary>
    /// Tenant used when a request carries no tenant header.
    /// </summary>
    /// <remarks>
    /// A development convenience so the SPA works before there is a login screen.
    /// Startup fails if this is set outside the Development environment, because a
    /// deployed API that silently defaults to some tenant is a data-leak waiting to
    /// happen.
    /// </remarks>
    public Guid? DefaultTenantId { get; set; }
}
