using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

public static class ToggleBreak
{
    public static async Task<Results<Ok<GetAttendance.Response>, NotFound, ProblemHttpResult>> HandleAsync(
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

        if (!AttendanceTimes.IsClockedIn(today))
        {
            return TypedResults.Problem(
                title: "Not clocked in",
                detail: "Take a break after punching in.",
                statusCode: StatusCodes.Status409Conflict);
        }

        today.OnBreak = !today.OnBreak;

        GetAttendance.Response? snapshot =
            await AttendanceDayStore.SnapshotAfterSaveAsync(dbContext, cancellationToken);

        return snapshot is null ? TypedResults.NotFound() : TypedResults.Ok(snapshot);
    }
}
