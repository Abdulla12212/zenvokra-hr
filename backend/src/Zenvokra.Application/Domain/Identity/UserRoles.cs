namespace Zenvokra.Application.Domain.Identity;

/// <summary>
/// Role names stored on <see cref="User"/> and issued as session claims.
/// </summary>
public static class UserRoles
{
    public const string PlatformAdmin = "PlatformAdmin";

    public const string TenantAdmin = "TenantAdmin";

    public const string Employee = "Employee";
}
