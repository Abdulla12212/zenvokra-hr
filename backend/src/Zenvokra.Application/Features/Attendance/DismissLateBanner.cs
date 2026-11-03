using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Features.Employees;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Attendance;

public static class DismissLateBanner
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

        List<AttendanceDay> lateDays = await dbContext.AttendanceDays
            .Where(day => day.EmployeeId == employee.Id)
            .ToListAsync(cancellationToken);

        foreach (AttendanceDay day in lateDays.Where(day => AttendanceTimes.IsLate(day.ClockIn)))
        {
            day.LateNoticeDismissed = true;
        }

        GetAttendance.Response? snapshot = await AttendanceDayStore.SnapshotAfterSaveAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);

        return snapshot is null ? TypedResults.NotFound() : TypedResults.Ok(snapshot);
    }
}
