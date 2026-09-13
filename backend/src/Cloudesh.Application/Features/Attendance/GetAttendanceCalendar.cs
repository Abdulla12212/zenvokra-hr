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

    public static async Task<Results<Ok<List<Cell>>, NotFound, ProblemHttpResult>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken,
        int? year = null,
        int? month = null,
        int? day = null)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);

        if (context is null)
        {
            return TypedResults.NotFound();
        }

        int calendarYear;
        int calendarMonth;

        if (year is >= 1 and <= 9999)
        {
            calendarYear = year.Value;
            calendarMonth = month is >= 1 and <= 12 ? month.Value : context.Today.Month;
        }
        else
        {
            calendarYear = context.Today.Year;
            calendarMonth = year is null && month is >= 1 and <= 12
                ? month.Value
                : context.Today.Month;
        }

        if (month is < 0 or > 12)
        {
            return TypedResults.Problem(
                title: "Invalid calendar",
                detail: "Month must be 1–12.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (year is < 0 or > 9999)
        {
            return TypedResults.Problem(
                title: "Invalid calendar",
                detail: "Year must be between 1 and 9999.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var monthStart = new DateOnly(calendarYear, calendarMonth, 1);
        int selectedDay = day is >= 1
            ? day.Value
            : (calendarYear == context.Today.Year && calendarMonth == context.Today.Month
                ? context.Today.Day
                : 1);

        return TypedResults.Ok(AttendanceCalendarBuilder.Build(context, monthStart, selectedDay));
    }
}
