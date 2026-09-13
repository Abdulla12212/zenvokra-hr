using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Attendance;

internal static class AttendanceDayStore
{
    public static async Task<AttendanceDay> GetOrCreateAsync(
        AppDbContext dbContext,
        Guid employeeId,
        DateOnly date,
        CancellationToken cancellationToken)
    {
        AttendanceDay? day = await dbContext.AttendanceDays
            .SingleOrDefaultAsync(
                row => row.EmployeeId == employeeId && row.Date == date,
                cancellationToken);

        if (day is not null)
        {
            return day;
        }

        day = AttendanceDay.Create(employeeId, date, null, null, null, null, string.Empty);
        dbContext.AttendanceDays.Add(day);
        return day;
    }

    public static async Task<GetAttendance.Response?> SnapshotAfterSaveAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);
        return context is null ? null : AttendanceComposer.Snapshot(context);
    }
}
