using Cloudesh.Application.Features.Attendance;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Employees;

public static class GetEmployeeAttendance
{
    public static async Task<Results<Ok<List<GetAttendanceCalendar.Cell>>, NotFound, ProblemHttpResult>> HandleAsync(
        Guid employeeId,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken,
        int? year = null,
        int? month = null,
        int? day = null)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadForEmployeeAsync(
            dbContext,
            timeProvider,
            employeeId,
            cancellationToken);

        if (context is null)
        {
            return TypedResults.NotFound();
        }

        int calendarYear = year ?? context.Today.Year;
        int calendarMonth = month ?? context.Today.Month;

        if (calendarMonth is < 1 or > 12 || calendarYear is < 1 or > 9999)
        {
            return TypedResults.Problem(
                title: "Invalid calendar",
                detail: "Month must be 1–12.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var monthStart = new DateOnly(calendarYear, calendarMonth, 1);
        int selectedDay = day
            ?? (calendarYear == context.Today.Year && calendarMonth == context.Today.Month
                ? context.Today.Day
                : 1);

        return TypedResults.Ok(AttendanceCalendarBuilder.Build(context, monthStart, selectedDay));
    }
}
