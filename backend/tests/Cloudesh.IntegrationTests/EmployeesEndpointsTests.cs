using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Identity;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class EmployeesEndpointsTests
{
    private readonly ApiFactory _factory;

    public EmployeesEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Tenant_admin_can_create_list_and_update_an_employee()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Roster Co",
            "hr@roster.test");

        HttpResponseMessage created = await admin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            NewEmployee("Ada Lovelace", "ada@roster.test", "EMP-1001"));

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        EmployeeBody? employee = await created.Content.ReadFromJsonAsync<EmployeeBody>();
        employee.ShouldNotBeNull();
        employee.FullName.ShouldBe("Ada Lovelace");
        employee.WorkEmail.ShouldBe("ada@roster.test");
        employee.EmployeeNumber.ShouldBe("EMP-1001");

        ListBody? listed = await admin.GetFromJsonAsync<ListBody>(
            new Uri("/api/employees", UriKind.Relative));
        listed.ShouldNotBeNull();
        listed.Items.ShouldContain(item => item.Id == employee.Id);

        HttpResponseMessage updated = await admin.PatchAsJsonAsync(
            new Uri($"/api/employees/{employee.Id}", UriKind.Relative),
            new
            {
                fullName = "Ada Byron",
                workEmail = "ada@roster.test",
                title = "Engineer",
                departmentName = "Engineering",
                location = "London",
                status = "Remote",
            });

        updated.StatusCode.ShouldBe(HttpStatusCode.OK);
        EmployeeBody? after = await updated.Content.ReadFromJsonAsync<EmployeeBody>();
        after.ShouldNotBeNull();
        after.FullName.ShouldBe("Ada Byron");
        after.Status.ShouldBe("Remote");
    }

    [Fact]
    public async Task Employee_can_sign_in_and_read_me()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Persona Co",
            "hr@persona.test");

        HttpResponseMessage created = await admin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            NewEmployee("Akram Hossain", "akram@persona.test", "EMP-1024"));

        created.EnsureSuccessStatusCode();
        EmployeeBody? employee = await created.Content.ReadFromJsonAsync<EmployeeBody>();
        employee.ShouldNotBeNull();

        HttpClient worker = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(worker, "akram@persona.test", "employee-pass");

        SessionBody? session = await worker.GetFromJsonAsync<SessionBody>(
            new Uri("/api/auth/me", UriKind.Relative));
        session.ShouldNotBeNull();
        session.Role.ShouldBe(UserRoles.Employee);
        session.Email.ShouldBe("akram@persona.test");

        EmployeeBody? me = await worker.GetFromJsonAsync<EmployeeBody>(
            new Uri("/api/employees/me", UriKind.Relative));
        me.ShouldNotBeNull();
        me.Id.ShouldBe(employee.Id);
        me.FullName.ShouldBe("Akram Hossain");
    }

    [Fact]
    public async Task Tenant_admin_cannot_read_me()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Admin Only",
            "hr@adminonly.test");

        HttpResponseMessage response = await admin.GetAsync(new Uri("/api/employees/me", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Employee_cannot_list_the_roster()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Hidden Roster",
            "hr@hiddenroster.test");

        HttpResponseMessage created = await admin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            NewEmployee("Only Me", "only@hiddenroster.test", "EMP-1"));
        created.EnsureSuccessStatusCode();

        HttpClient worker = _factory.CreateUnauthenticatedClient();
        await _factory.LoginAsync(worker, "only@hiddenroster.test", "employee-pass");

        HttpResponseMessage response = await worker.GetAsync(new Uri("/api/employees", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Employees_are_invisible_across_tenants()
    {
        HttpClient acmeAdmin = await _factory.CreateTenantAdminClientAsync(
            "Acme Isolation",
            "hr@acme-iso.test");
        HttpClient globexAdmin = await _factory.CreateTenantAdminClientAsync(
            "Globex Isolation",
            "hr@globex-iso.test");

        HttpResponseMessage created = await acmeAdmin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            NewEmployee("Secret", "secret@acme-iso.test", "EMP-7"));
        created.EnsureSuccessStatusCode();
        EmployeeBody? secret = await created.Content.ReadFromJsonAsync<EmployeeBody>();
        secret.ShouldNotBeNull();

        ListBody? globexList = await globexAdmin.GetFromJsonAsync<ListBody>(
            new Uri("/api/employees", UriKind.Relative));
        globexList.ShouldNotBeNull();
        globexList.Items.ShouldBeEmpty();

        HttpResponseMessage other = await globexAdmin.GetAsync(
            new Uri($"/api/employees/{secret.Id}", UriKind.Relative));
        other.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Employee_email_cannot_reuse_a_tenant_admin_email()
    {
        HttpClient admin = await _factory.CreateTenantAdminClientAsync(
            "Unique Mail",
            "hr@uniquemail.test");

        HttpResponseMessage response = await admin.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            NewEmployee("Clash", "hr@uniquemail.test", "EMP-2"));

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Platform_admin_cannot_call_tenant_employee_routes()
    {
        HttpClient platform = await _factory.CreatePlatformClientAsync();

        HttpResponseMessage response = await platform.GetAsync(new Uri("/api/employees", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    private static object NewEmployee(string fullName, string workEmail, string employeeNumber) => new
    {
        fullName,
        workEmail,
        password = "employee-pass",
        employeeNumber,
        departmentName = "Engineering",
        title = "Engineer",
        location = "Dhaka",
    };

    private sealed record EmployeeBody(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string WorkEmail,
        string Title,
        string DepartmentName,
        string Location,
        string Status);

    private sealed record ListBody(IReadOnlyList<EmployeeBody> Items, int TotalCount);

    private sealed record SessionBody(Guid UserId, string Email, string Role, Guid? TenantId, string? TenantName);
}
