using Cloudesh.Application.Common.Time;
using Cloudesh.Application.Domain.Attendance;

namespace Cloudesh.Application.Features.Attendance;

internal static class PunchLogBuilder
{
    public const int LookbackDays = 7;

    public static List<GetPunchLog.Group> Build(AttendanceComposer.Context context)
    {
        var groups = new List<GetPunchLog.Group>(LookbackDays);

        for (int offset = 0; offset < LookbackDays; offset++)
        {
            groups.Add(GroupFor(context.Today.AddDays(-offset), context));
        }

        return groups;
    }

    private static GetPunchLog.Group GroupFor(DateOnly date, AttendanceComposer.Context context)
    {
        AttendanceDay? day = context.Days.FirstOrDefault(row => row.Date == date);
        bool today = date == context.Today;
        bool clockedIn = AttendanceTimes.IsClockedIn(day);
        bool late = AttendanceTimes.IsLate(day?.ClockIn);
        string status = today
            ? clockedIn ? "Active" : day?.ClockIn is not null ? "Out" : "Not clocked in"
            : late
                ? "Late"
                : day?.ClockIn is not null
                    ? "Present"
                    : "No stamp";

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
        string? action = date > context.Today ? null : "edit";

        if (today && clockedIn && day?.ClockIn is TimeOnly openIn)
        {
            TimeSpan worked = AttendanceTimes.Worked(day, context.Today, context.NowTime);
            var open = new List<GetPunchLog.Entry>
            {
                new(
                    "in",
                    $"In {DateLabels.Time(openIn)}",
                    AttendanceTimes.IsLate(openIn)
                        ? $"Late · {place}"
                        : $"On-time · {place}",
                    "primary",
                    action),
            };

            if (day.ClockOut is TimeOnly lastOut)
            {
                open.Add(new(
                    "paused",
                    $"Last out {DateLabels.Time(lastOut)}",
                    "Paused earlier today",
                    "mute",
                    null));
            }

            open.Add(new(
                "now",
                $"Now {DateLabels.Time(context.NowTime)}",
                $"{DateLabels.Duration(worked)} recorded",
                "primary",
                null));

            return open;
        }

        if (day?.ClockIn is TimeOnly inTime)
        {
            TimeSpan worked = AttendanceTimes.Worked(day, context.Today, context.NowTime);
            string outLabel = day.ClockOut is TimeOnly outTime
                ? DateLabels.Time(outTime)
                : "—";
            string tardy = late
                ? $"{DateLabels.Duration(inTime - AttendanceTimes.ShiftStart)} tardiness"
                : "on-time";

            return
            [
                new(
                    date.ToString("yyyy-MM-dd"),
                    $"In {DateLabels.Time(inTime)} · Out {outLabel}",
                    $"{DateLabels.Duration(worked)} · {tardy}",
                    late ? "warn" : "ok",
                    action),
            ];
        }

        return
        [
            new(
                today ? "due" : "empty",
                today ? "Not clocked in" : "No stamp",
                today ? "Clock in on Home, or add a stamp" : "Add a missed punch",
                "mute",
                action),
        ];
    }
}
