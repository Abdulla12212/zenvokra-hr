using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Employees;

/// <summary>
/// A person in a tenant. The HR record outlives login — credentials live on
/// <c>EmployeeAccount</c>.
/// </summary>
public sealed class Employee : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    /// <summary>Set automatically on insert by <c>TenantSaveChangesInterceptor</c>.</summary>
    public Guid TenantId { get; set; }

    public required string FullName { get; set; }

    public required string EmployeeNumber { get; set; }

    public required string WorkEmail { get; set; }

    public required string Title { get; set; }

    /// <summary>Display name only — not a department entity.</summary>
    public required string DepartmentName { get; set; }

    public required string Location { get; set; }

    public required string ManagerName { get; set; }

    public DateOnly StartedOn { get; set; }

    public required string HoursLabel { get; set; }

    public required string WorkingDaysLabel { get; set; }

    public required string TimeZone { get; set; }

    public required string EmergencyContact { get; set; }

    public required string EmploymentType { get; set; }

    public required string Phone { get; set; }

    public required string TeamName { get; set; }

    public required string DeskLabel { get; set; }

    public required string Status { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    /// <summary>
    /// Isolation tests only need a distinct name, number, and email. The other
    /// fields get ordinary defaults so a create is one call.
    /// </summary>
    public static Employee Create(string fullName, string employeeNumber, string workEmail) => new()
    {
        Id = Guid.CreateVersion7(),
        FullName = fullName,
        EmployeeNumber = employeeNumber,
        WorkEmail = workEmail,
        Title = "Employee",
        DepartmentName = "Unassigned",
        Location = string.Empty,
        ManagerName = string.Empty,
        StartedOn = default,
        HoursLabel = "09:00–18:00",
        WorkingDaysLabel = "Mon–Fri",
        TimeZone = "UTC",
        EmergencyContact = string.Empty,
        EmploymentType = "Full-time",
        Phone = string.Empty,
        TeamName = string.Empty,
        DeskLabel = string.Empty,
        Status = EmployeeStatuses.Active,
    };
}
