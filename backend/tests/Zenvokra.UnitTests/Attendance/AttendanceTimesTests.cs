using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Features.Attendance;

namespace Zenvokra.UnitTests.Attendance;

public sealed class AttendanceTimesTests
{
    private static readonly DateOnly Today = new(2026, 9, 13);

    [Fact]
    public void Worked_is_zero_before_clock_in()
    {
        AttendanceDay day = Day(clockIn: null, clockOut: null);

        AttendanceTimes.Worked(day, Today, new TimeOnly(10, 0)).ShouldBe(TimeSpan.Zero);
    }

    [Fact]
    public void Worked_runs_from_clock_in_to_now_while_open()
    {
        AttendanceDay day = Day(new TimeOnly(9, 0), clockOut: null);

        AttendanceTimes.Worked(day, Today, new TimeOnly(10, 30)).ShouldBe(TimeSpan.FromMinutes(90));
    }

    [Fact]
    public void Worked_stops_at_clock_out()
    {
        AttendanceDay day = Day(new TimeOnly(9, 0), new TimeOnly(12, 0));

        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromHours(3));
    }

    [Fact]
    public void Clock_out_pauses_and_clock_in_resumes_from_the_same_total()
    {
        AttendanceDay day = Day(clockIn: null, clockOut: null);

        AttendanceTimes.StartSession(day, new TimeOnly(9, 0));
        AttendanceTimes.Worked(day, Today, new TimeOnly(10, 0)).ShouldBe(TimeSpan.FromHours(1));

        AttendanceTimes.CloseSession(day, new TimeOnly(10, 0));
        day.ClockIn.ShouldBe(new TimeOnly(9, 0));
        AttendanceTimes.IsClockedIn(day).ShouldBeFalse();
        AttendanceTimes.Worked(day, Today, new TimeOnly(12, 0)).ShouldBe(TimeSpan.FromHours(1));

        AttendanceTimes.StartSession(day, new TimeOnly(13, 0));
        day.ClockIn.ShouldBe(new TimeOnly(9, 0));
        AttendanceTimes.IsClockedIn(day).ShouldBeTrue();
        AttendanceTimes.Worked(day, Today, new TimeOnly(15, 0)).ShouldBe(TimeSpan.FromHours(3));

        AttendanceTimes.CloseSession(day, new TimeOnly(15, 0));
        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromHours(3));
    }

    [Fact]
    public void Worked_does_not_zero_out_when_a_leftover_break_covers_the_session()
    {
        AttendanceDay day = Day(clockIn: null, clockOut: null);
        AttendanceTimes.StartSession(day, new TimeOnly(9, 0));
        day.BreakStart = new TimeOnly(9, 0);
        day.BreakEnd = new TimeOnly(18, 0);

        AttendanceTimes.CloseSession(day, new TimeOnly(10, 0));

        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromHours(1));
        day.BreakStart.ShouldBeNull();
        day.BreakEnd.ShouldBeNull();
    }

    [Fact]
    public void Editing_a_closed_stamp_keeps_the_worked_total()
    {
        AttendanceDay day = Day(clockIn: null, clockOut: null);
        AttendanceTimes.StartSession(day, new TimeOnly(9, 0));
        AttendanceTimes.CloseSession(day, new TimeOnly(10, 15));
        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromMinutes(75));

        AttendanceTimes.ApplyEditedStamp(
            day,
            new TimeOnly(9, 0),
            new TimeOnly(10, 15),
            TimeOnly.MinValue,
            TimeOnly.MinValue,
            "Corrected.",
            keepOpen: false);

        AttendanceTimes.IsClockedIn(day).ShouldBeFalse();
        day.PriorWorked.ShouldBe(TimeSpan.FromMinutes(75));
        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromMinutes(75));
        day.BreakStart.ShouldBeNull();
        day.BreakEnd.ShouldBeNull();
    }

    [Fact]
    public void Overtime_is_hours_past_the_weekly_quota_not_each_long_day()
    {
        AttendanceTimes.OvertimeInWeek(TimeSpan.FromHours(38)).ShouldBe(TimeSpan.Zero);
        AttendanceTimes.OvertimeInWeek(TimeSpan.FromHours(40)).ShouldBe(TimeSpan.Zero);
        AttendanceTimes.OvertimeInWeek(TimeSpan.FromHours(42.5)).ShouldBe(TimeSpan.FromHours(2.5));
    }

    [Fact]
    public void Worked_ignores_break_stamps_on_a_paused_day()
    {
        AttendanceDay day = Day(new TimeOnly(9, 0), new TimeOnly(10, 0));
        day.PriorWorked = TimeSpan.FromHours(1);
        day.BreakStart = new TimeOnly(9, 0);
        day.BreakEnd = new TimeOnly(18, 0);

        AttendanceTimes.Worked(day, Today, new TimeOnly(18, 0)).ShouldBe(TimeSpan.FromHours(1));
    }

    private static AttendanceDay Day(TimeOnly? clockIn, TimeOnly? clockOut) =>
        AttendanceDay.Create(
            Guid.CreateVersion7(),
            Today,
            clockIn,
            clockOut,
            breakStart: null,
            breakEnd: null,
            note: string.Empty);
}
