using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Holidays;

public static class ListHolidays
{
    public sealed record Holiday(DateOnly Date, string Name, string Detail);

    public sealed record Response(string TodayIso, List<Holiday> Holidays);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        EmployeeReadModel.Detail? employee = await CurrentEmployee.GetAsync(
            httpContext,
            dbContext,
            cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        List<Holiday> holidays = await dbContext.CompanyHolidays
            .AsNoTracking()
            .OrderBy(holiday => holiday.Date)
            .Select(holiday => new Holiday(holiday.Date, holiday.Name, holiday.Detail))
            .ToListAsync(cancellationToken);

        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);

        return TypedResults.Ok(new Response(today.ToString("yyyy-MM-dd"), holidays));
    }
}
