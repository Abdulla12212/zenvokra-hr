using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Employees;

/// <summary>
/// <c>GET /api/employees/me</c> — the employee-app persona (prefer EMP-1024).
/// </summary>
public static class GetCurrentEmployee
{
    public sealed record Response(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string WorkEmail,
        string Title,
        string DepartmentName,
        string Location,
        string ManagerName,
        DateOnly StartedOn,
        string HoursLabel,
        string WorkingDaysLabel,
        string TimeZone,
        string EmergencyContact,
        string EmploymentType);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? persona = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

        if (persona is null)
        {
            return TypedResults.NotFound();
        }

        Response? employee = await dbContext.Employees
            .AsNoTracking()
            .Where(row => row.Id == persona.Id)
            .Select(row => new Response(
                row.Id,
                row.FullName,
                row.EmployeeNumber,
                row.WorkEmail,
                row.Title,
                row.DepartmentName,
                row.Location,
                row.ManagerName,
                row.StartedOn,
                row.HoursLabel,
                row.WorkingDaysLabel,
                row.TimeZone,
                row.EmergencyContact,
                row.EmploymentType))
            .SingleOrDefaultAsync(cancellationToken);

        return employee is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(employee);
    }
}
