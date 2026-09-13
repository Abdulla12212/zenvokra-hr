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

        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);
        AttendanceDay day = await AttendanceDayStore.GetOrCreateAsync(
            dbContext,
            employee.Id,
            today,
            cancellationToken);

        AttendanceTimes.StartSession(day, EmployeeClock.NowTime(timeProvider, employee.TimeZone));

        GetAttendance.Response? snapshot = await AttendanceDayStore.SnapshotAfterSaveAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);

        return snapshot is null ? TypedResults.NotFound() : TypedResults.Ok(snapshot);
    }
}
