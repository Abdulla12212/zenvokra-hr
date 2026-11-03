using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.Application.Features.Attendance;

public static class GetAttendance
{
    public sealed record WeekBar(string Id, string Day, string HoursLabel, int FillPercent, string Tone);

    public sealed record Response(
        bool ClockedIn,
        bool OnBreak,
        string ClockInTime,
        string RecordedTimer,
        string RecordedShort,
        int PercentOfShift,
        string CurrentTime,
        string EstimatedOut,
        string TimeUntilOut,
        string LocationLabel,
        string LocationReadyLabel,
        bool LateBannerVisible,
        bool LateDayFixed,
        string? LateDayIso,
        string LateDayTitle,
        string LateDayDetail,
        string WeekTotalLabel,
        string WeekShiftsLabel,
        bool WeekShiftsOk,
        string OvertimeLabel,
        List<WeekBar> WeekDays,
        string ClockInDetail,
        string BreakDetail,
        string PunchLogSummaryLabel,
        string TodayIso,
        string TodayLabel,
        string ClockOutTime,
        DateTimeOffset? ClockInAt,
        DateTimeOffset? ClockOutAt,
        int RecordedSeconds,
        int PriorWorkedSeconds,
        DateTimeOffset? OpenSinceAt);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(
            httpContext,
            dbContext,
            timeProvider,
            cancellationToken);

        return context is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(AttendanceComposer.Snapshot(context));
    }
}
