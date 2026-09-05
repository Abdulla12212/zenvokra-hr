using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

public sealed class LeaveEndpointsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public LeaveEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task A_created_request_comes_back_from_the_list_and_can_be_cancelled()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = await SeededClientAsync("leave-create");

        HttpResponseMessage created = await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from = "2026-08-25", to = "2026-08-26", note = "Family visit." },
            cancellationToken);

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        LeaveResponse? body = await created.Content.ReadFromJsonAsync<LeaveResponse>(cancellationToken);
        body.ShouldNotBeNull();
        body.Type.ShouldBe("Annual");
        body.Days.ShouldBe(2);
        body.Status.ShouldBe("pending");
        body.Note.ShouldBe("Family visit.");

        List<LeaveResponse>? list = await client.GetFromJsonAsync<List<LeaveResponse>>(
            new Uri("/api/leave/requests", UriKind.Relative),
            cancellationToken);

        list.ShouldNotBeNull();
        list.ShouldContain(row => row.Id == body.Id);

        HttpResponseMessage cancelled = await client.PostAsync(
            new Uri($"/api/leave/requests/{body.Id}/cancel", UriKind.Relative),
            content: null,
            cancellationToken);

        cancelled.StatusCode.ShouldBe(HttpStatusCode.OK);

        List<LeaveResponse>? after = await client.GetFromJsonAsync<List<LeaveResponse>>(
            new Uri("/api/leave/requests", UriKind.Relative),
            cancellationToken);

        after.ShouldNotBeNull();
        after.ShouldNotContain(row => row.Id == body.Id);
    }

    [Fact]
    public async Task Balances_are_recomputed_from_allowance_and_approved_requests()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = await SeededClientAsync("leave-balances");

        List<BalanceResponse>? balances = await client.GetFromJsonAsync<List<BalanceResponse>>(
            new Uri("/api/leave/balances", UriKind.Relative),
            cancellationToken);

        balances.ShouldNotBeNull();
        balances.ShouldContain(row => row.Type == "Annual" && row.Remaining == 20 && row.Total == 20);
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_leave_requests()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient acme = await SeededClientAsync("acme-leave");
        HttpClient globex = await SeededClientAsync("globex-leave");

        await acme.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from = "2026-08-25", to = "2026-08-26", note = "Acme" },
            cancellationToken);
        await globex.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Sick", from = "2026-08-21", to = "2026-08-21", note = "Globex" },
            cancellationToken);

        List<LeaveResponse>? acmeRows = await acme.GetFromJsonAsync<List<LeaveResponse>>(
            new Uri("/api/leave/requests", UriKind.Relative),
            cancellationToken);
        List<LeaveResponse>? globexRows = await globex.GetFromJsonAsync<List<LeaveResponse>>(
            new Uri("/api/leave/requests", UriKind.Relative),
            cancellationToken);

        acmeRows!.Select(row => row.Note).ShouldBe(["Acme"]);
        globexRows!.Select(row => row.Note).ShouldBe(["Globex"]);
    }

    [Fact]
    public async Task Overlapping_pending_dates_conflict()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = await SeededClientAsync("leave-overlap");

        await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from = "2026-08-25", to = "2026-08-26", note = "First" },
            cancellationToken);

        HttpResponseMessage second = await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Casual", from = "2026-08-26", to = "2026-08-27", note = "Overlap" },
            cancellationToken);

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    private async Task<HttpClient> SeededClientAsync(string slug)
    {
        Guid tenantId = await _factory.CreateTenantAsync(slug);

        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        using (tenantScopes.BeginScope(tenantId))
        {
            Employee employee = Employee.Create($"{slug} Person", "EMP-1000", $"{slug}@test.local");
            dbContext.Employees.Add(employee);
            dbContext.LeaveAllowances.AddRange(
                LeaveAllowance.Create(employee.Id, LeaveTypes.Annual, 20, 0),
                LeaveAllowance.Create(employee.Id, LeaveTypes.Casual, 10, 0),
                LeaveAllowance.Create(employee.Id, LeaveTypes.Sick, 10, 0));
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        return _factory.CreateClientFor(tenantId);
    }

    private sealed record LeaveResponse(
        Guid Id,
        string Type,
        string DatesLabel,
        int Days,
        string Status,
        string Note);

    private sealed record BalanceResponse(string Type, int Remaining, int Total);
}
