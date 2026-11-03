using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.PlatformTenants;

/// <summary>
/// Emails are unique across platform admins, tenant admins, and employee
/// accounts so login needs no tenant picker.
/// </summary>
internal static class PlatformEmailUniqueness
{
    public static Task<bool> IsTakenAsync(
        AppDbContext dbContext,
        string email,
        Guid? exceptAdminId,
        CancellationToken cancellationToken) =>
        IsTakenAsync(dbContext, email, exceptAdminId, exceptEmployeeAccountId: null, cancellationToken);

    public static async Task<bool> IsTakenAsync(
        AppDbContext dbContext,
        string email,
        Guid? exceptAdminId,
        Guid? exceptEmployeeAccountId,
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

        if (await admins.AnyAsync(cancellationToken))
        {
            return true;
        }

        var accounts = dbContext.EmployeeAccounts
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .Where(account => account.Email == email);

        if (exceptEmployeeAccountId is Guid accountId)
        {
            accounts = accounts.Where(account => account.Id != accountId);
        }

        return await accounts.AnyAsync(cancellationToken);
    }
}
