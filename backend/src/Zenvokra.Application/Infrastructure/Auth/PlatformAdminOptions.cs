namespace Zenvokra.Application.Infrastructure.Auth;

/// <summary>
/// Seeded platform-admin credentials. Bound from the <c>PlatformAdmin</c> section.
/// </summary>
public sealed class PlatformAdminOptions
{
    public const string SectionName = "PlatformAdmin";

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Email) && !string.IsNullOrWhiteSpace(Password);
}
