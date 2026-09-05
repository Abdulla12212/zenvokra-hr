using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Holidays;

/// <summary>
/// A tenant closed day. Shown on the Home calendar — not a leave deduction.
/// </summary>
public sealed class CompanyHoliday : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public DateOnly Date { get; set; }

    public required string Name { get; set; }

    public required string Detail { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static CompanyHoliday Create(DateOnly date, string name, string detail) => new()
    {
        Id = Guid.CreateVersion7(),
        Date = date,
        Name = name,
        Detail = detail,
    };
}
