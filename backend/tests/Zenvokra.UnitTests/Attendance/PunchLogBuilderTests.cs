using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Attendance;
using Zenvokra.Application.Features.Attendance;
using Zenvokra.Application.Features.Employees;

namespace Zenvokra.UnitTests.Attendance;

public sealed class PunchLogBuilderTests
{
    private static readonly DateOnly Today = new(2026, 9, 13);

    [Fact]
    public void Lists_seven_days_and_allows_edit_on_a_completed_stamp()
    {
        AttendanceDay day = AttendanceDay.Create(
            Guid.CreateVersion7(),
            Today.AddDays(-1),
            new TimeOnly(9, 0),
            new TimeOnly(17, 0),
            breakStart: null,
            breakEnd: null,
            note: string.Empty);

        List<GetPunchLog.Group> groups = PunchLogBuilder.Build(Context(day));

        groups.Count.ShouldBe(7);
        GetPunchLog.Group yesterday = groups.Single(group => group.Id == "2026-09-12");
        GetPunchLog.Entry stamp = yesterday.Entries.ShouldHaveSingleItem();
        stamp.Title.ShouldContain("In 09:00");
        stamp.Title.ShouldContain("Out 17:00");
        stamp.Action.ShouldBe("edit");
    }

    [Fact]
    public void Allows_adding_a_missed_stamp_on_an_empty_weekday()
    {
        List<GetPunchLog.Group> groups = PunchLogBuilder.Build(Context());

        GetPunchLog.Group empty = groups.Single(group => group.Id == "2026-09-12");
        empty.Entries.ShouldHaveSingleItem().Action.ShouldBe("edit");
    }

    private static AttendanceComposer.Context Context(params AttendanceDay[] days) =>
        new(
            new EmployeeReadModel.Detail(
                Guid.CreateVersion7(),
                "Ada Lovelace",
                "EMP-1",
                "ada@acme.test",
                "Engineer",
                "Engineering",
                "Dhaka",
                "Nadia Khan",
                new DateOnly(2024, 1, 1),
                "8h",
                "Mon–Fri",
                "UTC",
                string.Empty,
                "Full-time",
                string.Empty,
                "Platform",
                string.Empty,
                "Active"),
            days,
            [],
            [],
            Today,
            new TimeOnly(16, 0),
            new DateTimeOffset(2026, 9, 13, 16, 0, 0, TimeSpan.Zero),
            TimeZoneInfo.Utc);
}
