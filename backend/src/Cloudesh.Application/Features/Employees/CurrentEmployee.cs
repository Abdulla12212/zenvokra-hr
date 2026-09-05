using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

/// <summary>
/// The employee app has one person per tenant. Leave, punches, and inbox hang off
/// this row — there is no employee switcher.
/// </summary>
public static class CurrentEmployee
{
    public sealed record Info(Guid Id, string FullName, string Location, string ManagerName);

    public static Task<Info?> GetAsync(AppDbContext dbContext, CancellationToken cancellationToken) =>
        dbContext.Employees
            .AsNoTracking()
            .Select(employee => new Info(
                employee.Id,
                employee.FullName,
                employee.Location,
                employee.ManagerName))
            .SingleOrDefaultAsync(cancellationToken);
}
