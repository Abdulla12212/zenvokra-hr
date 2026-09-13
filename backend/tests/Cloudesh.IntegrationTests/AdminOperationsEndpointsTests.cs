using System.Net;
using System.Net.Http.Json;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class AdminOperationsEndpointsTests
{
    private readonly ApiFactory _factory;

    public AdminOperationsEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Organization_profile_defaults_from_the_company_name_and_locks_plan_fields()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Northwind Traders",
            "hr@northwind-org.test");

        OrganizationResponse? profile = await admin.GetFromJsonAsync<OrganizationResponse>(
            new Uri("/api/organization", UriKind.Relative),
            cancellationToken);

        profile.ShouldNotBeNull();
        profile.DisplayName.ShouldBe("Northwind Traders");
        profile.LegalName.ShouldBe("Northwind Traders");
        profile.SeatLimit.ShouldBe(100);
        profile.SubscriptionTier.ShouldBe("Standard");

        HttpResponseMessage updated = await admin.PatchAsJsonAsync(
            new Uri("/api/organization", UriKind.Relative),
            new
            {
                displayName = "Northwind",
                workEmail = "hr@northwind.test",
                supportHotline = "+880 1",
                officeLandline = "+880 2",
                websiteUrl = "https://northwind.test",
                industry = "Trade",
                fiscalYear = "July – June",
                workingDays = "Mon,Tue,Wed,Thu,Fri",
                shiftTiming = "09:00–18:00",
                officeFloors = "Level 1",
                legalName = "Hacked Ltd",
                seatLimit = 1,
                subscriptionTier = "Free",
            },
            cancellationToken);

        updated.StatusCode.ShouldBe(HttpStatusCode.OK);
        OrganizationResponse? after = await updated.Content.ReadFromJsonAsync<OrganizationResponse>(cancellationToken);
        after.ShouldNotBeNull();
        after.DisplayName.ShouldBe("Northwind");
        after.WorkEmail.ShouldBe("hr@northwind.test");
        after.LegalName.ShouldBe("Northwind Traders");
        after.SeatLimit.ShouldBe(100);
        after.SubscriptionTier.ShouldBe("Standard");
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_organization_or_approvals()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient acmeWorker, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Acme Ops",
            "hr@acme-ops.test",
            "ada@acme-ops.test",
            "EMP-3101");
        HttpClient acmeAdmin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(acmeAdmin, "hr@acme-ops.test", "admin-pass");

        (HttpClient globexWorker, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Globex Ops",
            "hr@globex-ops.test",
            "ada@globex-ops.test",
            "EMP-3102");
        HttpClient globexAdmin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(globexAdmin, "hr@globex-ops.test", "admin-pass");

        (DateOnly from, DateOnly to) = NextWeekdays();
        await acmeWorker.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "Acme secret" },
            cancellationToken);

        OrganizationResponse? acmeOrg = await acmeAdmin.GetFromJsonAsync<OrganizationResponse>(
            new Uri("/api/organization", UriKind.Relative),
            cancellationToken);
        OrganizationResponse? globexOrg = await globexAdmin.GetFromJsonAsync<OrganizationResponse>(
            new Uri("/api/organization", UriKind.Relative),
            cancellationToken);

        acmeOrg!.DisplayName.ShouldBe("Acme Ops");
        globexOrg!.DisplayName.ShouldBe("Globex Ops");

        ApprovalsResponse? acme = await acmeAdmin.GetFromJsonAsync<ApprovalsResponse>(
            new Uri("/api/approvals", UriKind.Relative),
            cancellationToken);
        ApprovalsResponse? globex = await globexAdmin.GetFromJsonAsync<ApprovalsResponse>(
            new Uri("/api/approvals", UriKind.Relative),
            cancellationToken);

        acme!.Pending.ShouldContain(item => item.Note == "Acme secret");
        globex!.Pending.ShouldBeEmpty();
        globex.PendingLeaves.ShouldBe(0);
    }

    [Fact]
    public async Task Tenant_admin_can_approve_leave_and_see_it_on_the_employee_leave_tab()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient worker, _, Guid employeeId) = await _factory.CreateEmployeeSessionAsync(
            "Leave Queue",
            "hr@leave-queue.test",
            "ada@leave-queue.test",
            "EMP-3103");
        HttpClient admin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(admin, "hr@leave-queue.test", "admin-pass");

        (DateOnly from, DateOnly to) = NextWeekdays();
        HttpResponseMessage created = await worker.PostAsJsonAsync(
            new Uri("/api/leave/requests", UriKind.Relative),
            new { type = "Annual", from, to, note = "Family visit" },
            cancellationToken);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        LeaveCreated? leave = await created.Content.ReadFromJsonAsync<LeaveCreated>(cancellationToken);
        leave.ShouldNotBeNull();

        ApprovalsResponse? before = await admin.GetFromJsonAsync<ApprovalsResponse>(
            new Uri("/api/approvals", UriKind.Relative),
            cancellationToken);
        before.ShouldNotBeNull();
        before.PendingLeaves.ShouldBe(1);
        before.Pending.ShouldContain(item => item.Id == leave.Id && item.Kind == "leave");

        HttpResponseMessage decided = await admin.PostAsJsonAsync(
            new Uri($"/api/approvals/{leave.Id}/decide", UriKind.Relative),
            new { kind = "leave", decision = "approve", note = "Enjoy." },
            cancellationToken);
        decided.StatusCode.ShouldBe(HttpStatusCode.OK);

        EmployeeLeaveResponse? tab = await admin.GetFromJsonAsync<EmployeeLeaveResponse>(
            new Uri($"/api/employees/{employeeId}/leave", UriKind.Relative),
            cancellationToken);
        tab.ShouldNotBeNull();
        tab.Requests.ShouldContain(row => row.Id == leave.Id && row.Status == "approved");

        DashboardResponse? dashboard = await admin.GetFromJsonAsync<DashboardResponse>(
            new Uri("/api/dashboard", UriKind.Relative),
            cancellationToken);
        dashboard.ShouldNotBeNull();
        dashboard.Headcount.ShouldBe(1);
        dashboard.PendingLeaves.ShouldBe(0);
    }

    [Fact]
    public async Task Tenant_admin_can_approve_a_punch_correction()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient worker, _, _) = await _factory.CreateEmployeeSessionAsync(
            "Punch Queue",
            "hr@punch-queue.test",
            "ada@punch-queue.test",
            "EMP-3104");
        HttpClient admin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(admin, "hr@punch-queue.test", "admin-pass");

        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        await worker.PostAsJsonAsync(new Uri("/api/attendance/clock-in", UriKind.Relative), new { }, cancellationToken);

        HttpResponseMessage created = await worker.PostAsJsonAsync(
            new Uri("/api/attendance/corrections", UriKind.Relative),
            new { date = today, requestedTime = "09:00", note = "Scanner reboot" },
            cancellationToken);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        PunchCreated? punch = await created.Content.ReadFromJsonAsync<PunchCreated>(cancellationToken);
        punch.ShouldNotBeNull();

        HttpResponseMessage decided = await admin.PostAsJsonAsync(
            new Uri($"/api/approvals/{punch.Id}/decide", UriKind.Relative),
            new { kind = "punch", decision = "approve" },
            cancellationToken);
        decided.StatusCode.ShouldBe(HttpStatusCode.OK);

        ApprovalsResponse? after = await admin.GetFromJsonAsync<ApprovalsResponse>(
            new Uri("/api/approvals", UriKind.Relative),
            cancellationToken);
        after.ShouldNotBeNull();
        after.PendingPunches.ShouldBe(0);
        after.Resolved.ShouldContain(item => item.Id == punch.Id && item.Status == "approved");
    }

    [Fact]
    public async Task Employee_cannot_read_admin_operations()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient worker, _, Guid employeeId) = await _factory.CreateEmployeeSessionAsync(
            "No Admin",
            "hr@no-admin.test",
            "ada@no-admin.test",
            "EMP-3105");

        (await worker.GetAsync(new Uri("/api/dashboard", UriKind.Relative), cancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await worker.GetAsync(new Uri("/api/approvals", UriKind.Relative), cancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await worker.GetAsync(new Uri("/api/organization", UriKind.Relative), cancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await worker.GetAsync(new Uri($"/api/employees/{employeeId}/leave", UriKind.Relative), cancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await worker.GetAsync(new Uri($"/api/employees/{employeeId}/attendance", UriKind.Relative), cancellationToken))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Tenant_admin_can_read_an_employee_calendar()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        (HttpClient worker, _, Guid employeeId) = await _factory.CreateEmployeeSessionAsync(
            "Calendar Tab",
            "hr@calendar-tab.test",
            "ada@calendar-tab.test",
            "EMP-3106");
        HttpClient admin = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(admin, "hr@calendar-tab.test", "admin-pass");

        await worker.PostAsJsonAsync(new Uri("/api/attendance/clock-in", UriKind.Relative), new { }, cancellationToken);

        HttpResponseMessage response = await admin.GetAsync(
            new Uri($"/api/employees/{employeeId}/attendance", UriKind.Relative),
            cancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        List<CalendarCell>? cells = await response.Content.ReadFromJsonAsync<List<CalendarCell>>(cancellationToken);
        cells.ShouldNotBeNull();
        cells.Count.ShouldBe(42);
        cells.ShouldContain(cell => cell.Today);
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

    private sealed record OrganizationResponse(
        Guid Id,
        string DisplayName,
        string WorkEmail,
        string LegalName,
        string SubscriptionTier,
        int SeatLimit);

    private sealed record ApprovalsResponse(
        IReadOnlyList<ApprovalItem> Pending,
        IReadOnlyList<ApprovalItem> Resolved,
        int PendingPunches,
        int PendingLeaves);

    private sealed record ApprovalItem(Guid Id, string Kind, string Status, string Note);

    private sealed record LeaveCreated(Guid Id);

    private sealed record PunchCreated(Guid Id);

    private sealed record EmployeeLeaveResponse(IReadOnlyList<LeaveRow> Requests);

    private sealed record LeaveRow(Guid Id, string Status);

    private sealed record DashboardResponse(int Headcount, int PendingLeaves);

    private sealed record CalendarCell(int? Day, bool Today);
}
