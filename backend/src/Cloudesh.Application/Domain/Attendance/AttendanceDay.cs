using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Attendance;

/// <summary>
/// One employee's stamps for a calendar day. Punch edits save immediately — there
/// is no approval trail on this row.
/// </summary>
public sealed class AttendanceDay : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public Guid EmployeeId { get; set; }

    public DateOnly Date { get; set; }

    public TimeOnly? ClockIn { get; set; }

    public TimeOnly? ClockOut { get; set; }

    /// <summary>
    /// Work already banked from earlier in/out pairs today. The open session
    /// starts at <see cref="OpenSince"/> and is not included here.
    /// </summary>
    public TimeSpan PriorWorked { get; set; }

    /// <summary>Start of the current open session, or null when the timer is paused.</summary>
    public TimeOnly? OpenSince { get; set; }

    public TimeOnly? BreakStart { get; set; }

    public TimeOnly? BreakEnd { get; set; }

    public required string Note { get; set; }

    public bool OnBreak { get; set; }

    public bool LateNoticeDismissed { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static AttendanceDay Create(
        Guid employeeId,
        DateOnly date,
        TimeOnly? clockIn,
        TimeOnly? clockOut,
        TimeOnly? breakStart,
        TimeOnly? breakEnd,
        string note,
        bool onBreak = false) => new()
        {
            Id = Guid.CreateVersion7(),
            EmployeeId = employeeId,
            Date = date,
            ClockIn = clockIn,
            ClockOut = clockOut,
            BreakStart = breakStart,
            BreakEnd = breakEnd,
            Note = note,
            OnBreak = onBreak,
        };
}
