using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

public static class GetStamp
{
    public sealed record Response(string InTime, string OutTime, string BreakStart, string BreakEnd, string Note);

    public static async Task<Results<Ok<Response>, NotFound, ProblemHttpResult>> HandleAsync(
        DateOnly date,
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (date == default)
        {
            return TypedResults.Problem(
                title: "Invalid date",
                detail: "Choose a calendar date.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        EmployeeReadModel.Detail? employee = await CurrentEmployee.GetAsync(
            httpContext,
            dbContext,
            cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        AttendanceDay? day = await dbContext.AttendanceDays
            .AsNoTracking()
            .SingleOrDefaultAsync(
                row => row.EmployeeId == employee.Id && row.Date == date,
                cancellationToken);

        bool suggestFix = AttendanceTimes.IsLate(day?.ClockIn);
        TimeOnly defaultIn = suggestFix ? AttendanceTimes.ShiftStart : day?.ClockIn ?? AttendanceTimes.ShiftStart;
        TimeOnly defaultOut = day?.ClockOut ?? AttendanceTimes.ShiftEnd;
        TimeOnly defaultBreakStart = day?.BreakStart ?? TimeOnly.MinValue;
        TimeOnly defaultBreakEnd = day?.BreakEnd ?? TimeOnly.MinValue;

        return TypedResults.Ok(new Response(
            DateLabels.Time(defaultIn),
            DateLabels.Time(defaultOut),
            DateLabels.Time(defaultBreakStart),
            DateLabels.Time(defaultBreakEnd),
            day?.Note ?? string.Empty));
    }
}
