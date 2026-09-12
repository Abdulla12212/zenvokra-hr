using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Identity;

/// <summary>
/// Login for one employee. The HR row stays on <c>Employee</c> if this account is
/// later removed.
/// </summary>
public sealed class EmployeeAccount : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    /// <summary>Set automatically on insert by <c>TenantSaveChangesInterceptor</c>.</summary>
    public Guid TenantId { get; set; }

    public Guid EmployeeId { get; set; }

    public required string Email { get; set; }

    /// <summary>Plaintext for this MVP. Replace before any real deployment.</summary>
    public required string Password { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    public static EmployeeAccount Create(Guid employeeId, string email, string password) => new()
    {
        Id = Guid.CreateVersion7(),
        EmployeeId = employeeId,
        Email = email,
        Password = password,
    };
}
