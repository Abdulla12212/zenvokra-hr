using Zenvokra.Application.Domain.Common;

namespace Zenvokra.Application.Domain.Identity;

/// <summary>
/// An org-level admin of exactly one company.
/// </summary>
public sealed class TenantAdmin : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    /// <summary>Set automatically on insert by <c>TenantSaveChangesInterceptor</c>.</summary>
    public Guid TenantId { get; set; }

    public required string Email { get; set; }

    /// <summary>Plaintext for this MVP. Replace before any real deployment.</summary>
    public required string Password { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static TenantAdmin Create(string email, string password) => new()
    {
        Id = Guid.CreateVersion7(),
        Email = email,
        Password = password,
    };
}
