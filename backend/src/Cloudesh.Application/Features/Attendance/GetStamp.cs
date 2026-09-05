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

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        DateOnly date,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

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

        return TypedResults.Ok(new Response(
            suggestFix ? "09:00" : DateLabels.Time(day?.ClockIn ?? new TimeOnly(9, 2)),
            DateLabels.Time(day?.ClockOut ?? (suggestFix ? new TimeOnly(18, 5) : EmployeeAppClock.ShiftEnd)),
            DateLabels.Time(day?.BreakStart ?? new TimeOnly(12, 15)),
            DateLabels.Time(day?.BreakEnd ?? new TimeOnly(13, 5)),
            day?.Note ?? (suggestFix ? "In was 09:00. Punch missed." : string.Empty)));
    }
}
