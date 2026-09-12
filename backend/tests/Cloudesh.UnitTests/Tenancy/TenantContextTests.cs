using System.Security.Claims;
using Cloudesh.Application.Infrastructure.Auth;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Shouldly;
using Xunit;

namespace Cloudesh.UnitTests.Tenancy;

public sealed class TenantContextTests
{
    private static readonly Guid FromClaim = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid LeftoverHeader = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public void Reads_the_tenant_from_the_session_claim()
    {
        var context = Create(authenticated: true, tenantClaim: FromClaim);

        context.TenantId.ShouldBe(FromClaim);
        context.HasTenant.ShouldBeTrue();
    }

    [Fact]
    public void Ignores_a_leftover_tenant_header()
    {
        var context = Create(
            authenticated: true,
            tenantClaim: FromClaim,
            leftoverHeader: LeftoverHeader.ToString());

        context.TenantId.ShouldBe(FromClaim);
    }

    [Fact]
    public void A_header_alone_does_not_resolve_a_tenant()
    {
        var context = Create(authenticated: false, leftoverHeader: LeftoverHeader.ToString());

        context.TenantId.ShouldBeNull();
        context.HasTenant.ShouldBeFalse();
    }

    [Fact]
    public void A_platform_admin_session_has_no_tenant()
    {
        var context = Create(authenticated: true, tenantClaim: null);

        context.TenantId.ShouldBeNull();
        context.HasTenant.ShouldBeFalse();
        context.FilterTenantId.ShouldBe(Guid.Empty);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void An_unusable_tenant_claim_leaves_the_tenant_unresolved(string claim)
    {
        var context = Create(authenticated: true, rawTenantClaim: claim);

        context.TenantId.ShouldBeNull();
    }

    [Fact]
    public void RequireTenantId_explains_that_the_session_is_missing_a_company()
    {
        var context = Create(authenticated: true, tenantClaim: null);

        var exception = Should.Throw<TenantNotResolvedException>(() => context.RequireTenantId());

        exception.Message.ShouldContain("session");
    }

    [Fact]
    public void A_scope_overrides_the_request_and_is_restored_on_dispose()
    {
        var context = Create(authenticated: true, tenantClaim: FromClaim);
        Guid scoped = Guid.Parse("33333333-3333-3333-3333-333333333333");

        using (context.BeginScope(scoped))
        {
            context.TenantId.ShouldBe(scoped);
        }

        context.TenantId.ShouldBe(FromClaim);
    }

    [Fact]
    public void A_scope_cannot_be_opened_for_an_empty_tenant()
    {
        var context = Create(authenticated: false);

        Should.Throw<ArgumentException>(() => context.BeginScope(Guid.Empty));
    }

    private static TenantContext Create(
        bool authenticated,
        Guid? tenantClaim = null,
        string? leftoverHeader = null,
        string? rawTenantClaim = null)
    {
        var httpContext = new DefaultHttpContext();

        if (leftoverHeader is not null)
        {
            httpContext.Request.Headers["X-Tenant-Id"] = leftoverHeader;
        }

        if (authenticated)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            };

            if (rawTenantClaim is not null)
            {
                claims.Add(new Claim(AuthClaims.TenantId, rawTenantClaim));
            }
            else if (tenantClaim is Guid id)
            {
                claims.Add(new Claim(AuthClaims.TenantId, id.ToString()));
            }

            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Cookies"));
        }

        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        return new TenantContext(accessor);
    }
}
