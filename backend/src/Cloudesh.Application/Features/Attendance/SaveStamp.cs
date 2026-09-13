using System.ComponentModel.DataAnnotations;
using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Features.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

public static class SaveStamp
{
    private const string TimePattern = @"^([01]\d|2[0-3]):[0-5]\d$";

    public sealed record Request
    {
        public DateOnly Date { get; init; }

        [Required(AllowEmptyStrings = false)]
        [RegularExpression(TimePattern)]
        public string InTime { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [RegularExpression(TimePattern)]
        public string OutTime { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [RegularExpression(TimePattern)]
        public string BreakStart { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [RegularExpression(TimePattern)]
        public string BreakEnd { get; init; } = string.Empty;

        [StringLength(400)]
        public string Note { get; init; } = string.Empty;
    }

    public static async Task<Results<Ok<GetAttendance.Response>, NotFound, ProblemHttpResult>> HandleAsync(
        Request request,
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

        if (request.Date == default
            || !AttendanceTimes.TryParseTime(request.InTime, out TimeOnly clockIn)
            || !AttendanceTimes.TryParseTime(request.OutTime, out TimeOnly clockOut)
            || !AttendanceTimes.TryParseTime(request.BreakStart, out TimeOnly breakStart)
            || !AttendanceTimes.TryParseTime(request.BreakEnd, out TimeOnly breakEnd))
        {
            return TypedResults.Problem(
                title: "Invalid stamp",
                detail: "Use HH:MM times and a real calendar date.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        AttendanceDay day = await AttendanceDayStore.GetOrCreateAsync(
            dbContext,
            employee.Id,
            request.Date,
            cancellationToken);

        DateOnly today = EmployeeClock.Today(timeProvider, employee.TimeZone);
        bool keepOpen = request.Date == today && AttendanceTimes.IsClockedIn(day);

        day.ClockIn = clockIn;
        day.BreakStart = breakStart;
        day.BreakEnd = breakEnd;
        day.Note = request.Note.Trim();

        if (!keepOpen)
        {
            day.ClockOut = clockOut;
            day.OnBreak = false;
        }

        if (!AttendanceTimes.IsLate(day.ClockIn))
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
