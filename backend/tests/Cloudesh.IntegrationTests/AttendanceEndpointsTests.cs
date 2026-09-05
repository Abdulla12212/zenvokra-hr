using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Domain.Leave;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

public sealed class AttendanceEndpointsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AttendanceEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Clock_in_and_out_persist_on_today()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = await SeededClientAsync("punch-roundtrip");

        AttendanceResponse? afterIn = await (await client.PostAsync(
            new Uri("/api/attendance/clock-in", UriKind.Relative),
            content: null,
            cancellationToken)).Content.ReadFromJsonAsync<AttendanceResponse>(cancellationToken);

        afterIn.ShouldNotBeNull();
        afterIn.ClockedIn.ShouldBeTrue();
        afterIn.ClockInTime.ShouldNotBeNullOrWhiteSpace();

        AttendanceResponse? afterOut = await (await client.PostAsync(
            new Uri("/api/attendance/clock-out", UriKind.Relative),
            content: null,
            cancellationToken)).Content.ReadFromJsonAsync<AttendanceResponse>(cancellationToken);

        afterOut.ShouldNotBeNull();
        afterOut.ClockedIn.ShouldBeFalse();

        AttendanceResponse? snapshot = await client.GetFromJsonAsync<AttendanceResponse>(
            new Uri("/api/attendance", UriKind.Relative),
            cancellationToken);

        snapshot.ShouldNotBeNull();
        snapshot.ClockedIn.ShouldBeFalse();
    }

    [Fact]
    public async Task Saving_a_late_stamp_clears_the_late_banner()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient client, Guid tenantId, Guid employeeId) = await SeededEmployeeAsync("fix-stamp");

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

            using (tenantScopes.BeginScope(tenantId))
            {
                dbContext.AttendanceDays.Add(AttendanceDay.Create(
                    employeeId,
                    new DateOnly(2026, 8, 19),
                    new TimeOnly(9, 42),
                    new TimeOnly(18, 8),
                    new TimeOnly(12, 15),
                    new TimeOnly(13, 5),
                    "Missed punch"));
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        AttendanceResponse? before = await client.GetFromJsonAsync<AttendanceResponse>(
            new Uri("/api/attendance", UriKind.Relative),
            cancellationToken);

        before.ShouldNotBeNull();
        before.LateBannerVisible.ShouldBeTrue();
        before.LateDayFixed.ShouldBeFalse();

        HttpResponseMessage saved = await client.PutAsJsonAsync(
            new Uri("/api/attendance/stamps", UriKind.Relative),
            new
            {
                date = "2026-08-19",
                inTime = "09:00",
                outTime = "18:05",
                breakStart = "12:15",
                breakEnd = "13:05",
                note = "In was 09:00. Punch missed.",
            },
            cancellationToken);

        saved.StatusCode.ShouldBe(HttpStatusCode.OK);
        AttendanceResponse? after = await saved.Content.ReadFromJsonAsync<AttendanceResponse>(cancellationToken);
        after.ShouldNotBeNull();
        after.LateDayFixed.ShouldBeTrue();
        after.LateBannerVisible.ShouldBeFalse();
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_attendance()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient acme = await SeededClientAsync("acme-att");
        HttpClient globex = await SeededClientAsync("globex-att");

        await acme.PostAsync(new Uri("/api/attendance/clock-in", UriKind.Relative), content: null, cancellationToken);

        AttendanceResponse? acmeSnap = await acme.GetFromJsonAsync<AttendanceResponse>(
            new Uri("/api/attendance", UriKind.Relative),
            cancellationToken);
        AttendanceResponse? globexSnap = await globex.GetFromJsonAsync<AttendanceResponse>(
            new Uri("/api/attendance", UriKind.Relative),
            cancellationToken);

        acmeSnap!.ClockedIn.ShouldBeTrue();
        globexSnap!.ClockedIn.ShouldBeFalse();
    }

    [Fact]
    public async Task Inbox_is_derived_per_tenant()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient acme = await SeededClientAsync("acme-inbox");
        HttpClient globex = await SeededClientAsync("globex-inbox");

        await acme.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from = "2026-08-25", to = "2026-08-26", note = "Acme trip" },
            cancellationToken);

        List<InboxResponse>? acmeInbox = await acme.GetFromJsonAsync<List<InboxResponse>>(
            new Uri("/api/inbox", UriKind.Relative),
            cancellationToken);
        List<InboxResponse>? globexInbox = await globex.GetFromJsonAsync<List<InboxResponse>>(
            new Uri("/api/inbox", UriKind.Relative),
            cancellationToken);

        acmeInbox.ShouldNotBeNull();
        acmeInbox.ShouldContain(item => item.Kind == "leave" && item.Title.Contains("waiting", StringComparison.Ordinal));
        globexInbox.ShouldNotBeNull();
        globexInbox.ShouldNotContain(item => item.Kind == "leave");
    }

    [Fact]
    public async Task Holidays_are_tenant_scoped()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient acme, Guid acmeId, _) = await SeededEmployeeAsync("acme-hol");
        (HttpClient globex, Guid globexId, _) = await SeededEmployeeAsync("globex-hol");

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

            using (tenantScopes.BeginScope(acmeId))
            {
                dbContext.CompanyHolidays.Add(CompanyHoliday.Create(
                    new DateOnly(2026, 9, 5),
                    "Company Day",
                    "Paid"));
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            using (tenantScopes.BeginScope(globexId))
            {
                dbContext.CompanyHolidays.Add(CompanyHoliday.Create(
                    new DateOnly(2026, 10, 1),
                    "Globex Day",
                    "Secret"));
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        List<HolidayResponse>? acmeDays = await acme.GetFromJsonAsync<List<HolidayResponse>>(
            new Uri("/api/holidays", UriKind.Relative),
            cancellationToken);
        List<HolidayResponse>? globexDays = await globex.GetFromJsonAsync<List<HolidayResponse>>(
            new Uri("/api/holidays", UriKind.Relative),
            cancellationToken);

        acmeDays!.Select(day => day.Name).ShouldBe(["Company Day"]);
        globexDays!.Select(day => day.Name).ShouldBe(["Globex Day"]);
    }

    private async Task<HttpClient> SeededClientAsync(string slug)
    {
        (HttpClient client, _, _) = await SeededEmployeeAsync(slug);
        return client;
    }

    private async Task<(HttpClient Client, Guid TenantId, Guid EmployeeId)> SeededEmployeeAsync(string slug)
    {
        Guid tenantId = await _factory.CreateTenantAsync(slug);
        Guid employeeId;

        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        using (tenantScopes.BeginScope(tenantId))
        {
            Employee employee = Employee.Create($"{slug} Person", "EMP-2000", $"{slug}@test.local");
            dbContext.Employees.Add(employee);
            dbContext.LeaveAllowances.AddRange(
                LeaveAllowance.Create(employee.Id, LeaveTypes.Annual, 20, 0),
                LeaveAllowance.Create(employee.Id, LeaveTypes.Casual, 10, 0),
                LeaveAllowance.Create(employee.Id, LeaveTypes.Sick, 10, 0));
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
            employeeId = employee.Id;
        }

        return (_factory.CreateClientFor(tenantId), tenantId, employeeId);
    }

    private sealed record AttendanceResponse(
        bool ClockedIn,
        string ClockInTime,
        bool LateBannerVisible,
        bool LateDayFixed);

    private sealed record InboxResponse(string Id, string Kind, string Title);

    private sealed record HolidayResponse(DateOnly Date, string Name, string Detail);
}
