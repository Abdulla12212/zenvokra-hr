namespace Zenvokra.Application.Infrastructure.Tenancy;

/// <summary>
/// Thrown when an operation needs a tenant but none could be determined from the
/// session. Surfaces as HTTP 400.
/// </summary>
public sealed class TenantNotResolvedException : Exception
{
    public TenantNotResolvedException()
        : base("The current tenant could not be resolved from the signed session.")
    {
    }

    public TenantNotResolvedException(string message)
        : base(message)
    {
    }

    public TenantNotResolvedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// Thrown when a save would read or write a row belonging to a different tenant.
/// </summary>
/// <remarks>
/// Reaching this exception means tenant isolation held but application code tried
/// to cross a tenant boundary — a bug, not a user error. It surfaces as HTTP 404
/// rather than 403 so that a caller cannot use the status code to discover which
/// ids exist in other tenants.
/// </remarks>
public sealed class CrossTenantOperationException : Exception
{
    public CrossTenantOperationException()
        : base("The operation targets an entity that belongs to a different tenant.")
    {
    }

    public CrossTenantOperationException(string message)
        : base(message)
    {
    }

    public CrossTenantOperationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public static CrossTenantOperationException For(string entityName, Guid entityTenantId, Guid? currentTenantId) =>
        new($"Refusing to save '{entityName}': it belongs to tenant '{entityTenantId}' but the current tenant is " +
            $"'{currentTenantId?.ToString() ?? "<none>"}'.");
}
