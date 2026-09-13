using Cloudesh.Application.Domain.Common;
using Cloudesh.Application.Domain.Leave;

namespace Cloudesh.Application.Domain.Approvals;

public sealed class PunchCorrection : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public Guid EmployeeId { get; set; }

    public DateOnly Date { get; set; }

    public TimeOnly RecordedTime { get; set; }

    public TimeOnly RequestedTime { get; set; }

    public required string Note { get; set; }

    public required string Status { get; set; }

    public bool ManagerVerified { get; set; }

    public required string DecisionNote { get; set; }

    public DateTimeOffset SentAtUtc { get; set; }

    public DateTimeOffset? DecidedAtUtc { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static PunchCorrection Create(
        Guid employeeId,
        DateOnly date,
        TimeOnly recordedTime,
        TimeOnly requestedTime,
        string note,
        DateTimeOffset sentAtUtc,
        bool managerVerified = false) => new()
        {
            Id = Guid.CreateVersion7(),
            EmployeeId = employeeId,
            Date = date,
            RecordedTime = recordedTime,
            RequestedTime = requestedTime,
            Note = note,
            Status = LeaveStatuses.Pending,
            ManagerVerified = managerVerified,
            DecisionNote = string.Empty,
            SentAtUtc = sentAtUtc.ToUniversalTime(),
        };
}
