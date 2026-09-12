namespace Cloudesh.Application.Domain.Identity;

public static class LoginEmail
{
    public static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
