using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

public static class ClockIn
{
    public static async Task<Results<Ok<GetAttendance.Response>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        CurrentEmployee.Info? employee = await CurrentEmployee.GetAsync(dbContext, cancellationToken);

        if (employee is null)
        {
            return TypedResults.NotFound();
        }

        AttendanceDay today = await AttendanceDayStore.GetOrCreateAsync(
            dbContext,
            employee.Id,
            EmployeeAppClock.Today,
            cancellationToken);

        if (today.ClockIn is null)
        {
            today.ClockIn = EmployeeAppClock.NowTime;
        }
        else
        {
            // Resume the same day rather than overwriting the morning stamp.
            today.ClockOut = null;
        }

        today.OnBreak = false;

        GetAttendance.Response? snapshot =
            await AttendanceDayStore.SnapshotAfterSaveAsync(dbContext, cancellationToken);

        return snapshot is null ? TypedResults.NotFound() : TypedResults.Ok(snapshot);
    }
}
