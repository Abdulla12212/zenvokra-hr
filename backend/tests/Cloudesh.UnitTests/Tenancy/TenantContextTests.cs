using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Shouldly;
using Xunit;

namespace Cloudesh.UnitTests.Tenancy;

public sealed class TenantContextTests
{
    private static readonly Guid FromHeader = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid FromConfig = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public void Reads_the_tenant_from_the_configured_header()
    {
        var context = Create(headerValue: FromHeader.ToString(), defaultTenantId: FromConfig);

        context.TenantId.ShouldBe(FromHeader);
    }

    [Fact]
    public void Falls_back_to_the_configured_default_when_the_header_is_absent()
    {
        var context = Create(headerValue: null, defaultTenantId: FromConfig);

        context.TenantId.ShouldBe(FromConfig);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void Falls_back_to_the_default_when_the_header_is_unusable(string headerValue)
    {
        var context = Create(headerValue, defaultTenantId: FromConfig);

        context.TenantId.ShouldBe(FromConfig);
    }

    [Fact]
    public void Has_no_tenant_when_there_is_no_header_and_no_default()
    {
        var context = Create(headerValue: null, defaultTenantId: null);

        context.TenantId.ShouldBeNull();
        context.HasTenant.ShouldBeFalse();
        context.FilterTenantId.ShouldBe(Guid.Empty);
    }

    [Fact]
    public void RequireTenantId_names_the_header_so_the_caller_knows_what_to_send()
    {
        var context = Create(headerValue: null, defaultTenantId: null, headerName: "X-Company");

        var exception = Should.Throw<TenantNotResolvedException>(() => context.RequireTenantId());

        exception.Message.ShouldContain("X-Company");
    }

    [Fact]
    public void A_scope_overrides_the_request_and_is_restored_on_dispose()
    {
        var context = Create(headerValue: FromHeader.ToString(), defaultTenantId: null);
        Guid scoped = Guid.Parse("33333333-3333-3333-3333-333333333333");

        using (context.BeginScope(scoped))
        {
            context.TenantId.ShouldBe(scoped);
        }

        context.TenantId.ShouldBe(FromHeader);
    }

    [Fact]
    public void A_scope_cannot_be_opened_for_an_empty_tenant()
    {
        var context = Create(headerValue: null, defaultTenantId: null);

        Should.Throw<ArgumentException>(() => context.BeginScope(Guid.Empty));
    }

    private static TenantContext Create(
        string? headerValue,
        Guid? defaultTenantId,
        string headerName = "X-Tenant-Id")
    {
        var httpContext = new DefaultHttpContext();

        if (headerValue is not null)
        {
            httpContext.Request.Headers[headerName] = headerValue;
        }

        var accessor = new HttpContextAccessor { HttpContext = httpContext };

        var options = Options.Create(new TenancyOptions
        {
            HeaderName = headerName,
            DefaultTenantId = defaultTenantId,
        });

        return new TenantContext(accessor, options);
    }
}
