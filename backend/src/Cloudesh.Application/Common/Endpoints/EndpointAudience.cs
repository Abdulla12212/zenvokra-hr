namespace Cloudesh.Application.Common.Endpoints;

/// <summary>
/// Which request pipeline a feature's endpoints sit behind.
/// </summary>
public enum EndpointAudience
{
    /// <summary>Tenant-scoped HR endpoints. Require a signed-in tenant admin.</summary>
    Tenant = 0,

    /// <summary>Platform-admin onboarding. No tenant; require the platform-admin role.</summary>
    Platform = 1,

    /// <summary>Login and session endpoints. No tenant and no role.</summary>
    Anonymous = 2,
}
