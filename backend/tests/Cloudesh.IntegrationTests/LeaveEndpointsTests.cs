using System.Net;
using System.Net.Http.Json;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class LeaveEndpointsTests
{
    private readonly ApiFactory _factory;

    public LeaveEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Employee_can_create_list_and_cancel_a_request()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient client, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Leave Roundtrip",
            "hr@leave-roundtrip.test",
            "ada@leave-roundtrip.test",
            "EMP-2101");

        (DateOnly from, DateOnly to) = NextWeekdays();

        HttpResponseMessage created = await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "Family visit." },
            cancellationToken);

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        LeaveResponse? body = await created.Content.ReadFromJsonAsync<LeaveResponse>(cancellationToken);
        body.ShouldNotBeNull();
        body.Type.ShouldBe("Annual");
        body.Days.ShouldBeGreaterThan(0);
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
    public async Task Creating_an_employee_seeds_default_balances()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient client, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Leave Balances",
            "hr@leave-balances.test",
            "ada@leave-balances.test",
            "EMP-2102");

        List<BalanceResponse>? balances = await client.GetFromJsonAsync<List<BalanceResponse>>(
            new Uri("/api/leave/balances", UriKind.Relative),
            cancellationToken);

        balances.ShouldNotBeNull();
        balances.ShouldContain(row => row.Type == "Annual" && row.Remaining == 20 && row.Total == 20);
        balances.ShouldContain(row => row.Type == "Casual" && row.Remaining == 10 && row.Total == 10);
        balances.ShouldContain(row => row.Type == "Sick" && row.Remaining == 10 && row.Total == 10);
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_leave_requests()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient acme, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Acme Leave",
            "hr@acme-leave.test",
            "ada@acme-leave.test",
            "EMP-2103");
        (HttpClient globex, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Globex Leave",
            "hr@globex-leave.test",
            "ada@globex-leave.test",
            "EMP-2104");

        (DateOnly from, DateOnly to) = NextWeekdays();
        DateOnly sickDay = from.AddDays(7);

        while (sickDay.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            sickDay = sickDay.AddDays(1);
        }

        await acme.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "Acme" },
            cancellationToken);
        await globex.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Sick", from = sickDay, to = sickDay, note = "Globex" },
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
        (HttpClient client, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Leave Overlap",
            "hr@leave-overlap.test",
            "ada@leave-overlap.test",
            "EMP-2105");

        (DateOnly from, DateOnly to) = NextWeekdays();

        await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "First" },
            cancellationToken);

        HttpResponseMessage second = await client.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Casual", from = to, to = to.AddDays(1), note = "Overlap" },
            cancellationToken);

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    private static (DateOnly From, DateOnly To) NextWeekdays()
    {
        DateOnly start = DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(21);

        while (start.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            start = start.AddDays(1);
        }

        DateOnly end = start.AddDays(1);

        while (end.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            end = end.AddDays(1);
        }

        return (start, end);
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
