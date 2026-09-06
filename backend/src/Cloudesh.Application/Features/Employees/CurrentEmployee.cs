using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

/// <summary>
/// The employee-app persona. Prefer EMP-1024 when the tenant has a roster so
/// punches and leave stay on Akram after admin creates more people.
/// </summary>
public static class CurrentEmployee
{
    public const string DemoEmployeeNumber = "EMP-1024";

    public sealed record Info(
        Guid Id,
        string FullName,
        string Location,
        string ManagerName,
        string EmployeeNumber);

    public static async Task<Info?> GetAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        Info? demo = await Project(dbContext.Employees.Where(employee => employee.EmployeeNumber == DemoEmployeeNumber))
            .SingleOrDefaultAsync(cancellationToken);

        if (demo is not null)
        {
            return demo;
        }

        return await Project(dbContext.Employees.OrderBy(employee => employee.EmployeeNumber))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static Task<Info?> GetByIdAsync(
        AppDbContext dbContext,
        Guid employeeId,
        CancellationToken cancellationToken) =>
        Project(dbContext.Employees.Where(employee => employee.Id == employeeId))
            .SingleOrDefaultAsync(cancellationToken);

    private static IQueryable<Info> Project(IQueryable<Employee> source) =>
        source
            .AsNoTracking()
            .Select(employee => new Info(
                employee.Id,
                employee.FullName,
                employee.Location,
                employee.ManagerName,
                employee.EmployeeNumber));
}
