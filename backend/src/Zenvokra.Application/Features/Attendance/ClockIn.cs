using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Common.Time;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Attendance;

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
