using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Features.Attendance;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Employees;

public static class GetEmployeeAttendance
{
    public static async Task<Results<Ok<List<GetAttendanceCalendar.Cell>>, NotFound>> HandleAsync(
        Guid employeeId,
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        string month = "august",
        int day = 20)
    {
        AttendanceComposer.Context? context =
            await AttendanceComposer.LoadAsync(dbContext, cancellationToken, employeeId);

        if (context is null)
        {
            return TypedResults.NotFound();
        }

        DateOnly monthStart = EmployeeAppClock.FirstOfMonth(month);
        return TypedResults.Ok(AttendanceCalendarBuilder.Build(context, monthStart, day));
    }
}
