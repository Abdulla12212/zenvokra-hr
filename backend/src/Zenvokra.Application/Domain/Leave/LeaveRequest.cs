using Zenvokra.Application.Domain.Common;

namespace Zenvokra.Application.Domain.Leave;

public sealed class LeaveRequest : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public Guid EmployeeId { get; set; }

    public required string Type { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public int Days { get; set; }

    public required string Status { get; set; }

    public required string ApproverName { get; set; }

    public required string Note { get; set; }

    public required string DecisionNote { get; set; }

    public DateTimeOffset SentAtUtc { get; set; }

    public DateTimeOffset? DecidedAtUtc { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static LeaveRequest Create(
        Guid employeeId,
        string type,
        DateOnly startDate,
        DateOnly endDate,
        int days,
        string status,
        string approverName,
        string note,
        DateTimeOffset sentAtUtc,
        DateTimeOffset? decidedAtUtc = null) => new()
        {
            Id = Guid.CreateVersion7(),
            EmployeeId = employeeId,
            Type = type,
            StartDate = startDate,
            EndDate = endDate,
            Days = days,
            Status = status,
            ApproverName = approverName,
            Note = note,
            DecisionNote = string.Empty,
            SentAtUtc = sentAtUtc.ToUniversalTime(),
            DecidedAtUtc = decidedAtUtc?.ToUniversalTime(),
        };
}
