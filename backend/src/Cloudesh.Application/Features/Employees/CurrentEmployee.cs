using System.Security.Claims;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

/// <summary>
/// The signed-in employee, resolved from the session account id.
/// </summary>
public static class CurrentEmployee
{
    public static async Task<EmployeeReadModel.Detail?> GetAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (httpContext.User.Identity?.IsAuthenticated != true
            || !httpContext.User.IsInRole(UserRoles.Employee))
        {
            return null;
        }

        string? accountIdValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(accountIdValue, out Guid accountId))
        {
            return null;
        }

        Guid? employeeId = await dbContext.EmployeeAccounts
            .AsNoTracking()
            .Where(account => account.Id == accountId)
            .Select(account => (Guid?)account.EmployeeId)
            .SingleOrDefaultAsync(cancellationToken);

        if (employeeId is not Guid id)
        {
            return null;
        }

        return await EmployeeReadModel
            .Project(dbContext.Employees.AsNoTracking().Where(employee => employee.Id == id))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
