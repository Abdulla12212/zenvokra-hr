using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Attendance;
using Cloudesh.Application.Domain.Holidays;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class AttendanceEndpointsTests
{
    private readonly ApiFactory _factory;

    public AttendanceEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Clock_in_and_out_persist_on_today()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient client, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Punch Roundtrip",
            "hr@punch-roundtrip.test",
            "ada@punch-roundtrip.test",
            "EMP-2001");

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
        (HttpClient client, Guid tenantId, Guid employeeId) = await _factory.CreateEmployeeSessionAsync(
            "Fix Stamp",
            "hr@fix-stamp.test",
            "ada@fix-stamp.test",
            "EMP-2002");

        DateOnly lateDay = DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(-1);

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

            using (tenantScopes.BeginScope(tenantId))
            {
                dbContext.AttendanceDays.Add(AttendanceDay.Create(
                    employeeId,
                    lateDay,
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
                date = lateDay.ToString("yyyy-MM-dd"),
                inTime = "09:00",
                outTime = "18:05",
                breakStart = "12:15",
                breakEnd = "13:05",
                note = "Corrected.",
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
        (HttpClient acme, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Acme Att",
            "hr@acme-att.test",
            "ada@acme-att.test",
            "EMP-2003");
        (HttpClient globex, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Globex Att",
            "hr@globex-att.test",
            "ada@globex-att.test",
            "EMP-2004");

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
        (HttpClient acme, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Acme Inbox",
            "hr@acme-inbox.test",
            "ada@acme-inbox.test",
            "EMP-2005");
        (HttpClient globex, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Globex Inbox",
            "hr@globex-inbox.test",
            "ada@globex-inbox.test",
            "EMP-2006");

        (DateOnly from, DateOnly to) = NextWeekdays();

        await acme.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "Acme trip" },
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
        (HttpClient acme, Guid acmeId, _) = await _factory.CreateEmployeeSessionAsync(
            "Acme Hol",
            "hr@acme-hol.test",
            "ada@acme-hol.test",
            "EMP-2007");
        (HttpClient globex, Guid globexId, _) = await _factory.CreateEmployeeSessionAsync(
            "Globex Hol",
            "hr@globex-hol.test",
            "ada@globex-hol.test",
            "EMP-2008");

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

        HolidayCalendarResponse? acmeDays = await acme.GetFromJsonAsync<HolidayCalendarResponse>(
            new Uri("/api/holidays", UriKind.Relative),
            cancellationToken);
        HolidayCalendarResponse? globexDays = await globex.GetFromJsonAsync<HolidayCalendarResponse>(
            new Uri("/api/holidays", UriKind.Relative),
            cancellationToken);

        acmeDays.ShouldNotBeNull();
        acmeDays.TodayIso.ShouldNotBeNullOrWhiteSpace();
        acmeDays.Holidays.Select(day => day.Name).ShouldBe(["Company Day"]);
        globexDays.ShouldNotBeNull();
        globexDays.Holidays.Select(day => day.Name).ShouldBe(["Globex Day"]);
    }

    [Fact]
    public async Task Tenant_admin_cannot_read_employee_time_routes()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Admin Time",
            "hr@admin-time.test");

        (await admin.GetAsync(new Uri("/api/attendance", UriKind.Relative)))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await admin.GetAsync(new Uri("/api/leave/balances", UriKind.Relative)))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await admin.GetAsync(new Uri("/api/inbox", UriKind.Relative)))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    private static (DateOnly From, DateOnly To) NextWeekdays()
    {
        DateOnly start = DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(14);

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

    private sealed record AttendanceResponse(
        bool ClockedIn,
        string ClockInTime,
        bool LateBannerVisible,
        bool LateDayFixed);

    private sealed record InboxResponse(string Id, string Kind, string Title);

    private sealed record HolidayCalendarResponse(string TodayIso, List<HolidayResponse> Holidays);

    private sealed record HolidayResponse(DateOnly Date, string Name, string Detail);
}
