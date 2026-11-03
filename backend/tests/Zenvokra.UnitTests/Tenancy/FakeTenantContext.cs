using Zenvokra.Application.Infrastructure.Tenancy;

namespace Zenvokra.UnitTests.Tenancy;

/// <summary>
/// Test double for <see cref="ITenantContext"/> with a directly settable tenant, so
/// a test can switch tenants without going through HTTP headers.
/// </summary>
internal sealed class FakeTenantContext : ITenantContext, ITenantScopeFactory
{
    public FakeTenantContext(Guid? tenantId = null) => TenantId = tenantId;

    public Guid? TenantId { get; set; }

    public Guid RequireTenantId() => TenantId ?? throw new TenantNotResolvedException();

    public IDisposable BeginScope(Guid tenantId)
    {
        Guid? previous = TenantId;
        TenantId = tenantId;
        return new Scope(this, previous);
    }

    private sealed class Scope : IDisposable
    {
        private readonly FakeTenantContext _owner;
        private readonly Guid? _previous;

        public Scope(FakeTenantContext owner, Guid? previous)
        {
            _owner = owner;
            _previous = previous;
        }

        public void Dispose() => _owner.TenantId = _previous;
    }
}
