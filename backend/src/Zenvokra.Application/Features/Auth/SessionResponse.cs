namespace Zenvokra.Application.Features.Auth;

public sealed record SessionResponse(
    Guid UserId,
    string Email,
    string Role,
    Guid? TenantId,
    string? TenantName);
