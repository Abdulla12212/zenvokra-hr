namespace Cloudesh.Application.Features.PlatformTenants;

public sealed record TenantSummary(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive,
    int AdminCount,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record TenantAdminSummary(Guid Id, string Email, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc);
