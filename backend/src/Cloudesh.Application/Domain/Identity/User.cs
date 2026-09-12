using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Identity;

/// <summary>
/// A platform-level account. Not tenant-scoped — platform admins exist outside
/// any company.
/// </summary>
public sealed class User : IAuditable
{
    public Guid Id { get; set; }

    public required string Email { get; set; }

    /// <summary>Plaintext for this MVP. Replace before any real deployment.</summary>
    public required string Password { get; set; }

    public required string Role { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static User CreatePlatformAdmin(string email, string password) => new()
    {
        Id = Guid.CreateVersion7(),
        Email = email,
        Password = password,
        Role = UserRoles.PlatformAdmin,
    };
}
