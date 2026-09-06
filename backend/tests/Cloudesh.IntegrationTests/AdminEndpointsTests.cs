using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Domain.Organization;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

public sealed class AdminEndpointsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AdminEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Organization_is_readable_and_contact_fields_can_be_updated()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid tenantId = await _factory.CreateTenantAsync("org-profile");
        await AddOrganizationAsync(tenantId);

        HttpClient client = _factory.CreateClientFor(tenantId);
        OrganizationResponse? before = await client.GetFromJsonAsync<OrganizationResponse>(
            new Uri("/api/organization", UriKind.Relative),
            cancellationToken);

        before.ShouldNotBeNull();
        before.DisplayName.ShouldBe("Acme Consulting");
        before.ClientCode.ShouldBe("ACME-BD-2024");

        HttpResponseMessage patched = await client.PatchAsJsonAsync(
            new Uri("/api/organization", UriKind.Relative),
            new
            {
                displayName = "Acme Consulting HQ",
                workEmail = "people@acmeconsulting.test",
                supportHotline = "+880 2-55000000",
                officeLandline = "+880 2-55000001",
                websiteUrl = "https://acmeconsulting.test",
                industry = "Professional services",
                fiscalYear = "July – June",
                workingDays = "Mon,Tue,Wed,Thu,Fri",
                shiftTiming = "09:00–18:00",
                officeFloors = "Floors 4 and 5",
            },
            cancellationToken);

        patched.StatusCode.ShouldBe(HttpStatusCode.OK);

        OrganizationResponse? after = await patched.Content.ReadFromJsonAsync<OrganizationResponse>(cancellationToken);
        after.ShouldNotBeNull();
        after.DisplayName.ShouldBe("Acme Consulting HQ");
        after.WorkEmail.ShouldBe("people@acmeconsulting.test");
        after.ClientCode.ShouldBe("ACME-BD-2024");
        after.SeatLimit.ShouldBe(100);
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_organization()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid acmeId = await _factory.CreateTenantAsync("org-acme");
        Guid globexId = await _factory.CreateTenantAsync("org-globex");
        await AddOrganizationAsync(acmeId);

        HttpClient globex = _factory.CreateClientFor(globexId);
        HttpResponseMessage response = await globex.GetAsync(
            new Uri("/api/organization", UriKind.Relative),
            cancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Admin_can_approve_a_pending_leave_request()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid tenantId = await _factory.CreateTenantAsync("approve-leave");
        Guid employeeId = await AddEmployeeAsync(tenantId, "Akram Hossain", "EMP-1024", "akram@approve.test");
        Guid requestId = await AddLeaveAsync(tenantId, employeeId);

        HttpClient client = _factory.CreateClientFor(tenantId);
        HttpResponseMessage decided = await client.PostAsJsonAsync(
            new Uri($"/api/approvals/{requestId}/decide", UriKind.Relative),
            new { kind = "leave", decision = "approve", note = string.Empty },
            cancellationToken);

        decided.StatusCode.ShouldBe(HttpStatusCode.OK);

        ApprovalsResponse? approvals = await decided.Content.ReadFromJsonAsync<ApprovalsResponse>(cancellationToken);
        approvals.ShouldNotBeNull();
        approvals.Pending.ShouldBeEmpty();
        approvals.Resolved.ShouldContain(item => item.Id == requestId && item.Status == "approved");
    }

    [Fact]
    public async Task Dashboard_does_not_count_another_tenants_employees()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid acmeId = await _factory.CreateTenantAsync("dash-acme");
        Guid globexId = await _factory.CreateTenantAsync("dash-globex");

        await AddEmployeeAsync(acmeId, "Akram Hossain", "EMP-1024", "akram@dash-acme.test");
        await AddEmployeeAsync(globexId, "Not Yours", "EMP-9999", "nope@dash-globex.test");

        HttpClient acme = _factory.CreateClientFor(acmeId);
        DashboardResponse? dashboard = await acme.GetFromJsonAsync<DashboardResponse>(
            new Uri("/api/dashboard", UriKind.Relative),
            cancellationToken);

        dashboard.ShouldNotBeNull();
        dashboard.Headcount.ShouldBe(1);
    }

    private async Task AddOrganizationAsync(Guid tenantId)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        using (tenantScopes.BeginScope(tenantId))
        {
            dbContext.OrganizationProfiles.Add(OrganizationProfile.CreateAcme());
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
    }

    private async Task<Guid> AddEmployeeAsync(Guid tenantId, string fullName, string employeeNumber, string workEmail)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        var employee = Employee.Create(fullName, employeeNumber, workEmail);

        using (tenantScopes.BeginScope(tenantId))
        {
            dbContext.Employees.Add(employee);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        return employee.Id;
    }

    private async Task<Guid> AddLeaveAsync(Guid tenantId, Guid employeeId)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        var request = LeaveRequest.Create(
            employeeId,
            LeaveTypes.Annual,
            new DateOnly(2026, 8, 25),
            new DateOnly(2026, 8, 26),
            2,
            LeaveStatuses.Pending,
            "Nadia Chowdhury",
            "Family visit.",
            new DateTimeOffset(2026, 8, 20, 9, 41, 0, TimeSpan.FromHours(6)));

        using (tenantScopes.BeginScope(tenantId))
        {
            dbContext.LeaveRequests.Add(request);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        return request.Id;
    }

    private sealed record OrganizationResponse(
        Guid Id,
        string DisplayName,
        string WorkEmail,
        string ClientCode,
        int SeatLimit);

    private sealed record ApprovalsResponse(IReadOnlyList<ApprovalItem> Pending, IReadOnlyList<ApprovalItem> Resolved);

    private sealed record ApprovalItem(Guid Id, string Status);

    private sealed record DashboardResponse(int Headcount);
}
