using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Leave;

/// <summary>
/// Annual entitlement for one leave type. Remaining days are recomputed from
/// this row plus pending and approved requests — the stored number is not mutated.
/// </summary>
public sealed class LeaveAllowance : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public Guid EmployeeId { get; set; }

    public required string Type { get; set; }

    public int TotalDays { get; set; }

    /// <summary>Days already used that are not represented as listed requests.</summary>
    public int OpeningUsedDays { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static LeaveAllowance Create(Guid employeeId, string type, int totalDays, int openingUsedDays) => new()
    {
        Id = Guid.CreateVersion7(),
        EmployeeId = employeeId,
        Type = type,
        TotalDays = totalDays,
        OpeningUsedDays = openingUsedDays,
    };
}
