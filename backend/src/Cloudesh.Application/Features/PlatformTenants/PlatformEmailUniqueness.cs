using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.PlatformTenants;

/// <summary>
/// Emails are unique across platform admins and tenant admins so login needs no
/// tenant picker.
/// </summary>
internal static class PlatformEmailUniqueness
{
    public static async Task<bool> IsTakenAsync(
        AppDbContext dbContext,
        string email,
        Guid? exceptAdminId,
        CancellationToken cancellationToken)
    {
        bool usedByPlatformAdmin = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(user => user.Email == email, cancellationToken);

        if (usedByPlatformAdmin)
        {
            return true;
        }

        // Uniqueness is platform-wide; naming the filter keeps tenant isolation
        // on any other filter that may be added later.
        var admins = dbContext.TenantAdmins
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .Where(admin => admin.Email == email);

        if (exceptAdminId is Guid adminId)
        {
            admins = admins.Where(admin => admin.Id != adminId);
        }

        return await admins.AnyAsync(cancellationToken);
    }
}
