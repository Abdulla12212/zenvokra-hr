using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Cloudesh.Application.Infrastructure.Tenancy;

/// <summary>
/// Resolves the current tenant from the incoming request, with an explicit escape
/// hatch for code that runs outside a request.
/// </summary>
/// <remarks>
/// <para>
/// Resolution order: an active <see cref="BeginScope"/> override, then the tenant
/// header, then <see cref="TenancyOptions.DefaultTenantId"/>.
/// </para>
/// <para>
/// TODO(auth): a client-supplied header is trivially forgeable and is only
/// acceptable because nothing is authenticated yet. When authentication lands,
/// replace <see cref="ResolveFromRequest"/> with a read of the tenant claim on
/// <c>HttpContext.User</c> and delete <see cref="TenancyOptions.DefaultTenantId"/>.
/// This method is the only place that needs to change.
/// </para>
/// </remarks>
public sealed class TenantContext : ITenantContext, ITenantScopeFactory
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TenancyOptions _options;

    private Guid? _scopeOverride;
    private Guid? _resolved;
    private bool _hasResolved;

    public TenantContext(IHttpContextAccessor httpContextAccessor, IOptions<TenancyOptions> options)
    {
        _httpContextAccessor = httpContextAccessor;
        _options = options.Value;
    }

    public Guid? TenantId => _scopeOverride ?? ResolveOnce();

    // ITenantContext supplies default implementations of these two, but a default
    // interface member is only reachable through the interface. Declaring them here keeps
    // them usable on the concrete type as well.
    public bool HasTenant => TenantId.HasValue;

    public Guid FilterTenantId => TenantId ?? Guid.Empty;

    public Guid RequireTenantId() =>
        TenantId ?? throw TenantNotResolvedException.ForHeader(_options.HeaderName);

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

        if (httpContext is not null
            && httpContext.Request.Headers.TryGetValue(_options.HeaderName, out var header)
            && Guid.TryParse(header.ToString(), out Guid fromHeader)
            && fromHeader != Guid.Empty)
        {
            return fromHeader;
        }

        return _options.DefaultTenantId;
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
