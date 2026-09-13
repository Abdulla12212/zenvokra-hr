using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;

namespace Cloudesh.Application.Features.Attendance;

internal static class PunchLogBuilder
{
    public static List<GetPunchLog.Group> Build(AttendanceComposer.Context context)
    {
        DateOnly[] dates =
        [
            context.Today,
            context.Today.AddDays(-1),
            context.Today.AddDays(-2),
        ];

        return dates.Select(date => GroupFor(date, context)).ToList();
    }

    private static GetPunchLog.Group GroupFor(DateOnly date, AttendanceComposer.Context context)
    {
        AttendanceDay? day = context.Days.FirstOrDefault(row => row.Date == date);
        bool today = date == context.Today;
        bool clockedIn = AttendanceTimes.IsClockedIn(day);
        bool late = AttendanceTimes.IsLate(day?.ClockIn);
        string status = today
            ? clockedIn ? "Active" : "Out"
            : late
                ? "Late"
                : day?.ClockIn is not null
                    ? "Present"
                    : "Scheduled";

        return new GetPunchLog.Group(
            date.ToString("yyyy-MM-dd"),
            $"{DateLabels.DayName(date)} {date.Day} {DateLabels.MonthName(date)} · {status}",
            Entries(date, day, today, clockedIn, late, context));
    }

    private static List<GetPunchLog.Entry> Entries(
        DateOnly date,
        AttendanceDay? day,
        bool today,
        bool clockedIn,
        bool late,
        AttendanceComposer.Context context)
    {
        string place = AttendanceComposer.Workplace(context);

        if (today && clockedIn && day?.ClockIn is TimeOnly clockIn)
        {
            TimeSpan worked = AttendanceTimes.Worked(day, context.Today, context.NowTime);
            var entries = new List<GetPunchLog.Entry>
            {
                new(
                    "in",
                    $"In {DateLabels.Time(clockIn)}",
                    AttendanceTimes.IsLate(clockIn)
                        ? $"Late · {place}"
                        : $"On-time · {place}",
                    "primary",
                    "edit"),
            };

            if (day.BreakStart is TimeOnly breakStart && day.BreakEnd is TimeOnly breakEnd)
            {
                entries.Add(new(
                    "break",
                    $"Break {DateLabels.Time(breakStart)}–{DateLabels.Time(breakEnd)}",
                    AttendanceTimes.BreakDetail(day).Split(" · ").LastOrDefault() ?? "Break",
                    "mute",
                    null));
            }

            entries.Add(new(
                "now",
                $"Now {DateLabels.Time(context.NowTime)}",
                $"{DateLabels.Duration(worked)} recorded",
                "primary",
                null));

            return entries;
        }

        if (today && !clockedIn)
        {
            return
            [
                new("due", "Due 09:00", "Not clocked in", "mute", null),
            ];
        }

        if (day?.ClockIn is TimeOnly inTime && day.ClockOut is TimeOnly outTime)
        {
            TimeSpan worked = AttendanceTimes.Worked(day, context.Today, context.NowTime);
            string tardy = late && inTime > AttendanceTimes.ShiftStart
                ? $"{DateLabels.Duration(inTime - AttendanceTimes.ShiftStart)} tardiness"
                : "on-time";

            return
            [
                new(
                    date.ToString("yyyy-MM-dd"),
                    $"In {DateLabels.Time(inTime)} · Out {DateLabels.Time(outTime)}",
                    $"{DateLabels.Duration(worked)} · {tardy}",
                    late ? "warn" : "ok",
                    late ? "fix" : null),
            ];
        }

        return
        [
            new("empty", "No stamp", "Scheduled", "mute", null),
        ];
    }
}
