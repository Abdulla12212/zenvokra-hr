using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Employees;

/// <summary>
/// A person in a tenant. The employee app reads Akram via <c>GET /employees/me</c>;
/// admin lists and edits the roster.
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

    /// <summary>Display name only — not a foreign key to the Departments skeleton.</summary>
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

    public bool IsAdmin { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    /// <summary>
    /// Defaults match the hardcoded employee-app persona so the demo seed is one call.
    /// Isolation tests only need a distinct name, number, and email.
    /// </summary>
    public static Employee Create(string fullName, string employeeNumber, string workEmail) => new()
    {
        Id = Guid.CreateVersion7(),
        FullName = fullName,
        EmployeeNumber = employeeNumber,
        WorkEmail = workEmail,
        Title = "Senior Software Engineer",
        DepartmentName = "Engineering",
        Location = "Dhaka HQ",
        ManagerName = "Nadia Chowdhury",
        StartedOn = new DateOnly(2024, 1, 12),
        HoursLabel = "09:00–18:00",
        WorkingDaysLabel = "Mon–Fri",
        TimeZone = "Asia/Dhaka",
        EmergencyContact = "Farah Hossain",
        EmploymentType = "Full-time",
        Phone = string.Empty,
        TeamName = "Platform Team",
        DeskLabel = string.Empty,
        Status = "Active",
        IsAdmin = false,
    };
}
