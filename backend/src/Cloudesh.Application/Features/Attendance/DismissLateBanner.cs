using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

public static class DismissLateBanner
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

        List<AttendanceDay> lateDays = await dbContext.AttendanceDays
            .Where(day => day.EmployeeId == employee.Id)
            .ToListAsync(cancellationToken);

        foreach (AttendanceDay day in lateDays.Where(day => AttendanceTimes.IsLate(day.ClockIn)))
        {
            day.LateNoticeDismissed = true;
        }

        GetAttendance.Response? snapshot =
            await AttendanceDayStore.SnapshotAfterSaveAsync(dbContext, cancellationToken);

        return snapshot is null ? TypedResults.NotFound() : TypedResults.Ok(snapshot);
    }
}
