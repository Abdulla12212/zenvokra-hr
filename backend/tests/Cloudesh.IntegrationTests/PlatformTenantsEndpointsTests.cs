using System.Net;
using System.Net.Http.Json;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class PlatformTenantsEndpointsTests
{
    private readonly ApiFactory _factory;

    public PlatformTenantsEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Unauthenticated_platform_routes_are_rejected()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/api/platform/tenants", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_tenant_admin_cannot_use_platform_routes()
    {
        HttpClient tenantAdmin = await _factory.CreateTenantAdminClientAsync(
            "Blocked Co",
            "hr@blocked.test");

        HttpResponseMessage response = await tenantAdmin.GetAsync(
            new Uri("/api/platform/tenants", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Platform_admin_can_create_list_update_and_delete_a_company()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();

        HttpResponseMessage created = await platform.PostAsJsonAsync(
            new Uri("/api/platform/tenants", UriKind.Relative),
            new { name = "Acme Consulting" });

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        TenantBody? tenant = await created.Content.ReadFromJsonAsync<TenantBody>();
        tenant.ShouldNotBeNull();
        tenant.Name.ShouldBe("Acme Consulting");
        tenant.Slug.ShouldBe("acme-consulting");
        tenant.IsActive.ShouldBeTrue();
        tenant.AdminCount.ShouldBe(0);

        TenantPage? page = await platform.GetFromJsonAsync<TenantPage>(
            new Uri("/api/platform/tenants", UriKind.Relative));
        page.ShouldNotBeNull();
        page.Items.ShouldContain(item => item.Id == tenant.Id);

        HttpResponseMessage updated = await platform.PutAsJsonAsync(
            new Uri($"/api/platform/tenants/{tenant.Id}", UriKind.Relative),
            new { name = "Acme Consulting Ltd", isActive = false });

        updated.StatusCode.ShouldBe(HttpStatusCode.OK);
        TenantBody? renamed = await updated.Content.ReadFromJsonAsync<TenantBody>();
        renamed.ShouldNotBeNull();
        renamed.Name.ShouldBe("Acme Consulting Ltd");
        renamed.Slug.ShouldBe("acme-consulting");
        renamed.IsActive.ShouldBeFalse();

        HttpResponseMessage deleted = await platform.DeleteAsync(
            new Uri($"/api/platform/tenants/{tenant.Id}", UriKind.Relative));

        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        HttpResponseMessage missing = await platform.GetAsync(
            new Uri($"/api/platform/tenants/{tenant.Id}", UriKind.Relative));
        missing.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Duplicate_company_names_get_distinct_slugs()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();

        TenantBody first = await CreateCompanyAsync(platform, "Twin Co");
        TenantBody second = await CreateCompanyAsync(platform, "Twin Co");

        first.Slug.ShouldBe("twin-co");
        second.Slug.ShouldBe("twin-co-2");
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_admins()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();

        (Guid acmeId, Guid acmeAdminId) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Acme Isolation",
            "a@acme-iso.test");
        (Guid globexId, Guid globexAdminId) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Globex Isolation",
            "b@globex-iso.test");

        AdminPage? acme = await platform.GetFromJsonAsync<AdminPage>(
            new Uri($"/api/platform/tenants/{acmeId}/admins", UriKind.Relative));
        AdminPage? globex = await platform.GetFromJsonAsync<AdminPage>(
            new Uri($"/api/platform/tenants/{globexId}/admins", UriKind.Relative));

        acme.ShouldNotBeNull();
        globex.ShouldNotBeNull();
        acme.Items.Select(admin => admin.Id).ShouldBe([acmeAdminId]);
        globex.Items.Select(admin => admin.Id).ShouldBe([globexAdminId]);
    }

    [Fact]
    public async Task A_reused_admin_email_conflicts()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();
        (Guid tenantId, _) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Email Clash",
            "shared@clash.test");

        HttpResponseMessage second = await platform.PostAsJsonAsync(
            new Uri($"/api/platform/tenants/{tenantId}/admins", UriKind.Relative),
            new { email = "shared@clash.test", password = "another-pass" });

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task A_tenant_admin_can_be_updated_and_removed()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();
        (Guid tenantId, Guid adminId) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Edit Co",
            "old@edit.test");

        HttpResponseMessage updated = await platform.PutAsJsonAsync(
            new Uri($"/api/platform/tenants/{tenantId}/admins/{adminId}", UriKind.Relative),
            new { email = "new@edit.test" });

        updated.StatusCode.ShouldBe(HttpStatusCode.OK);
        AdminBody? admin = await updated.Content.ReadFromJsonAsync<AdminBody>();
        admin.ShouldNotBeNull();
        admin.Email.ShouldBe("new@edit.test");

        HttpResponseMessage deleted = await platform.DeleteAsync(
            new Uri($"/api/platform/tenants/{tenantId}/admins/{adminId}", UriKind.Relative));

        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        AdminPage? remaining = await platform.GetFromJsonAsync<AdminPage>(
            new Uri($"/api/platform/tenants/{tenantId}/admins", UriKind.Relative));
        remaining.ShouldNotBeNull();
        remaining.TotalCount.ShouldBe(0);
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    public async Task An_invalid_company_name_is_rejected_before_the_handler_runs(string name)
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();

        HttpResponseMessage response = await platform.PostAsJsonAsync(
            new Uri("/api/platform/tenants", UriKind.Relative),
            new { name });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Missing_tenants_and_admins_are_not_found()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();
        Guid missing = Guid.CreateVersion7();

        (await platform.GetAsync(new Uri($"/api/platform/tenants/{missing}", UriKind.Relative)))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);

        (await platform.GetAsync(new Uri($"/api/platform/tenants/{missing}/admins", UriKind.Relative)))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    private static async Task<TenantBody> CreateCompanyAsync(HttpClient platform, string name)
    {
        HttpResponseMessage created = await platform.PostAsJsonAsync(
            new Uri("/api/platform/tenants", UriKind.Relative),
            new { name });

        created.EnsureSuccessStatusCode();
        TenantBody? tenant = await created.Content.ReadFromJsonAsync<TenantBody>();
        ArgumentNullException.ThrowIfNull(tenant);
        return tenant;
    }

    private sealed record TenantPage(List<TenantBody> Items, int Page, int PageSize, int TotalCount);

    private sealed record TenantBody(
        Guid Id,
        string Name,
        string Slug,
        bool IsActive,
        int AdminCount,
        DateTimeOffset CreatedAtUtc);

    private sealed record AdminPage(List<AdminBody> Items, int Page, int PageSize, int TotalCount);

    private sealed record AdminBody(Guid Id, string Email, DateTimeOffset CreatedAtUtc);
}
