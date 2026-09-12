using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Identity;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class AuthEndpointsTests
{
    private readonly ApiFactory _factory;

    public AuthEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Platform_admin_can_sign_in_and_has_no_tenant()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/api/auth/login", UriKind.Relative),
            new { email = ApiFactory.PlatformAdminEmail, password = ApiFactory.PlatformAdminPassword });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        SessionBody? session = await response.Content.ReadFromJsonAsync<SessionBody>();
        session.ShouldNotBeNull();
        session.Email.ShouldBe(ApiFactory.PlatformAdminEmail);
        session.Role.ShouldBe(UserRoles.PlatformAdmin);
        session.TenantId.ShouldBeNull();
        session.TenantName.ShouldBeNull();

        SessionBody? me = await client.GetFromJsonAsync<SessionBody>(new Uri("/api/auth/me", UriKind.Relative));
        me.ShouldNotBeNull();
        me.Role.ShouldBe(UserRoles.PlatformAdmin);
        me.TenantId.ShouldBeNull();
    }

    [Fact]
    public async Task Wrong_password_is_rejected_without_revealing_the_account()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/api/auth/login", UriKind.Relative),
            new { email = ApiFactory.PlatformAdminEmail, password = "wrong-password" });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        ProblemBody? problem = await response.Content.ReadFromJsonAsync<ProblemBody>();
        problem.ShouldNotBeNull();
        problem.Detail.ShouldBe("Invalid email or password.");
    }

    [Fact]
    public async Task Unknown_email_looks_the_same_as_a_wrong_password()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/api/auth/login", UriKind.Relative),
            new { email = "nobody@example.test", password = "whatever1" });

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Tenant_admin_session_carries_the_company()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();
        (Guid tenantId, _) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Globex",
            "hr@globex.test");

        HttpClient tenantAdmin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(tenantAdmin, "hr@globex.test", "admin-pass");

        SessionBody? me = await tenantAdmin.GetFromJsonAsync<SessionBody>(
            new Uri("/api/auth/me", UriKind.Relative));

        me.ShouldNotBeNull();
        me.Role.ShouldBe(UserRoles.TenantAdmin);
        me.Email.ShouldBe("hr@globex.test");
        me.TenantId.ShouldBe(tenantId);
        me.TenantName.ShouldBe("Globex");
    }

    [Fact]
    public async Task An_inactive_company_cannot_sign_in()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();
        (Guid tenantId, _) = await _factory.CreateTenantWithAdminAsync(
            platform,
            "Suspended Co",
            "hr@suspended.test");

        HttpResponseMessage updated = await platform.PutAsJsonAsync(
            new Uri($"/api/platform/tenants/{tenantId}", UriKind.Relative),
            new { name = "Suspended Co", isActive = false });

        updated.EnsureSuccessStatusCode();

        HttpClient tenantAdmin = _factory.CreateUnauthenticatedClient();
        HttpResponseMessage response = await tenantAdmin.PostAsJsonAsync(
            new Uri("/api/auth/login", UriKind.Relative),
            new { email = "hr@suspended.test", password = "admin-pass" });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Employee_session_carries_the_company()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Worker Co",
            "hr@worker.test");

        HttpResponseMessage created = await admin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            new
            {
                fullName = "Pat Worker",
                workEmail = "pat@worker.test",
                password = "employee-pass",
                employeeNumber = "EMP-10",
                departmentName = "Ops",
                title = "Analyst",
                location = "Dhaka",
            });

        created.EnsureSuccessStatusCode();

        HttpClient worker = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(worker, "pat@worker.test", "employee-pass");

        SessionBody? me = await worker.GetFromJsonAsync<SessionBody>(
            new Uri("/api/auth/me", UriKind.Relative));

        me.ShouldNotBeNull();
        me.Role.ShouldBe(UserRoles.Employee);
        me.Email.ShouldBe("pat@worker.test");
        me.TenantName.ShouldBe("Worker Co");
        me.TenantId.ShouldNotBeNull();
    }

    [Fact]
    public async Task Me_without_a_session_is_unauthorized()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/api/auth/me", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    private sealed record SessionBody(Guid UserId, string Email, string Role, Guid? TenantId, string? TenantName);

    private sealed record ProblemBody(string? Title, string? Detail, int? Status);
}
