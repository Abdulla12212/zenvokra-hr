using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Zenvokra.Application.Infrastructure.Auth;

namespace Zenvokra.Application.Infrastructure.Tenancy;

/// <summary>
/// Resolves the current tenant from the signed session, with an explicit escape
/// hatch for code that runs outside a request.
/// </summary>
/// <remarks>
/// Resolution order: an active <see cref="BeginScope"/> override, then the
/// <c>tenant_id</c> claim on <c>HttpContext.User</c>. Platform admins and
/// anonymous callers have no tenant. This method is the only place that decides
/// how a request maps onto a tenant — do not add a second resolver.
/// </remarks>
public sealed class TenantContext : ITenantContext, ITenantScopeFactory
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    private Guid? _scopeOverride;
    private Guid? _resolved;
    private bool _hasResolved;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId => _scopeOverride ?? ResolveOnce();

    // ITenantContext supplies default implementations of these two, but a default
    // interface member is only reachable through the interface. Declaring them here keeps
    // them usable on the concrete type as well.
    public bool HasTenant => TenantId.HasValue;

    public Guid FilterTenantId => TenantId ?? Guid.Empty;

    public Guid RequireTenantId() =>
        TenantId ?? throw new TenantNotResolvedException(
            "The current tenant could not be resolved from the signed session.");

    public IDisposable BeginScope(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id must not be empty.", nameof(tenantId));
        }

        Guid? previous = _scopeOverride;
        _scopeOverride = tenantId;
        return new TenantScope(this, previous);
    }

    private Guid? ResolveOnce()
    {
        if (_hasResolved)
        {
            return _resolved;
        }

        _resolved = ResolveFromRequest();
        _hasResolved = true;
        return _resolved;
    }

    private Guid? ResolveFromRequest()
    {
        HttpContext? httpContext = _httpContextAccessor.HttpContext;
        ClaimsPrincipal? user = httpContext?.User;

        if (user?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        string? tenantClaim = user.FindFirstValue(AuthClaims.TenantId);

        if (Guid.TryParse(tenantClaim, out Guid fromClaim) && fromClaim != Guid.Empty)
        {
            return fromClaim;
        }

        return null;
    }

    private sealed class TenantScope : IDisposable
    {
        private readonly TenantContext _owner;
        private readonly Guid? _previous;
        private bool _disposed;

        public TenantScope(TenantContext owner, Guid? previous)
        {
            _owner = owner;
            _previous = previous;
        }

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }

            _owner._scopeOverride = _previous;
            _disposed = true;
        }
    }
}
