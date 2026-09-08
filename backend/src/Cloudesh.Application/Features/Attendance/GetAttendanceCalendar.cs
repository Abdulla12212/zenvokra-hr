using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

public static class GetAttendanceCalendar
{
    public sealed record Cell(
        int? Day,
        bool Weekend,
        bool Today,
        bool Selected,
        bool InRange,
        string Kind,
        string? MetaPrimary,
        string? MetaSecondary,
        bool ShowPlane,
        string? ClockIn,
        string? ClockOut,
        string? Hours,
        string? BreakDuration,
        string? Note);

    public static async Task<Results<Ok<List<Cell>>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken,
        string month = "august",
        int day = 20)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(dbContext, cancellationToken);

        if (context is null)
        {
            return TypedResults.NotFound();
        }

        DateOnly monthStart = EmployeeAppClock.FirstOfMonth(month);
        return TypedResults.Ok(AttendanceCalendarBuilder.Build(context, monthStart, day));
    }
}
