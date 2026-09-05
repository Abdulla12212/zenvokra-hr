using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Cloudesh.Application.Features.Attendance;

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
        string WeekTotalLabel,
        string WeekShiftsLabel,
        bool WeekShiftsOk,
        string OvertimeLabel,
        List<WeekBar> WeekDays,
        string ClockInDetail,
        string BreakDetail,
        string PunchLogSummaryLabel);

    public static async Task<Results<Ok<Response>, NotFound>> HandleAsync(
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        AttendanceComposer.Context? context = await AttendanceComposer.LoadAsync(dbContext, cancellationToken);

        return context is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(AttendanceComposer.Snapshot(context));
    }
}
