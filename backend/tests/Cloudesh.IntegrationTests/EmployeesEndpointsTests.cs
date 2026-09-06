using System.Net;
using System.Net.Http.Json;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

public sealed class EmployeesEndpointsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public EmployeesEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task A_request_without_a_tenant_header_is_rejected()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = _factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

        ProblemResponse? problem = await response.Content.ReadFromJsonAsync<ProblemResponse>(cancellationToken);
        problem.ShouldNotBeNull();
        problem.Detail.ShouldNotBeNull();
        problem.Detail.ShouldContain(ApiFactory.TenantHeader);
    }

    [Fact]
    public async Task Me_is_not_found_when_the_tenant_has_no_employee()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        HttpClient client = await _factory.CreateClientForNewTenantAsync("empty-employee");

        HttpResponseMessage response = await client.GetAsync(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Me_returns_the_current_tenants_employee()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid tenantId = await _factory.CreateTenantAsync("akram-tenant");
        await AddEmployeeAsync(tenantId, "Akram Hossain", "EMP-1024", "akram.hossain@acmeconsulting.test");

        HttpClient client = _factory.CreateClientFor(tenantId);
        EmployeeResponse? employee = await client.GetFromJsonAsync<EmployeeResponse>(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);

        employee.ShouldNotBeNull();
        employee.FullName.ShouldBe("Akram Hossain");
        employee.EmployeeNumber.ShouldBe("EMP-1024");
        employee.WorkEmail.ShouldBe("akram.hossain@acmeconsulting.test");
        employee.Title.ShouldBe("Senior Software Engineer");
        employee.DepartmentName.ShouldBe("Engineering");
        employee.Location.ShouldBe("Dhaka HQ");
        employee.ManagerName.ShouldBe("Nadia Chowdhury");
        employee.StartedOn.ShouldBe(new DateOnly(2024, 1, 12));
        employee.HoursLabel.ShouldBe("09:00–18:00");
        employee.WorkingDaysLabel.ShouldBe("Mon–Fri");
        employee.TimeZone.ShouldBe("Asia/Dhaka");
        employee.EmergencyContact.ShouldBe("Farah Hossain");
        employee.EmploymentType.ShouldBe("Full-time");
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_employees()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid acmeId = await _factory.CreateTenantAsync("acme-employees");
        Guid globexId = await _factory.CreateTenantAsync("globex-employees");

        await AddEmployeeAsync(acmeId, "Akram Hossain", "EMP-1024", "akram.hossain@acmeconsulting.test");
        await AddEmployeeAsync(globexId, "Not Yours", "EMP-9999", "nope@globex.test");

        HttpClient acme = _factory.CreateClientFor(acmeId);
        HttpClient globex = _factory.CreateClientFor(globexId);

        EmployeeResponse? acmeEmployee = await acme.GetFromJsonAsync<EmployeeResponse>(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);
        EmployeeResponse? globexEmployee = await globex.GetFromJsonAsync<EmployeeResponse>(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);

        acmeEmployee!.FullName.ShouldBe("Akram Hossain");
        acmeEmployee.EmployeeNumber.ShouldBe("EMP-1024");
        globexEmployee!.FullName.ShouldBe("Not Yours");
        globexEmployee.EmployeeNumber.ShouldBe("EMP-9999");
    }

    [Fact]
    public async Task Me_prefers_akram_when_the_tenant_has_a_roster()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid tenantId = await _factory.CreateTenantAsync("roster-me");
        await AddEmployeeAsync(tenantId, "Nadia Chowdhury", "EMP-1001", "nadia@roster.test");
        await AddEmployeeAsync(tenantId, "Akram Hossain", "EMP-1024", "akram@roster.test");

        HttpClient client = _factory.CreateClientFor(tenantId);
        EmployeeResponse? employee = await client.GetFromJsonAsync<EmployeeResponse>(
            new Uri("/api/employees/me", UriKind.Relative),
            cancellationToken);

        employee.ShouldNotBeNull();
        employee.EmployeeNumber.ShouldBe("EMP-1024");
        employee.FullName.ShouldBe("Akram Hossain");
    }

    [Fact]
    public async Task List_returns_the_tenant_roster_and_not_another_tenants()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid acmeId = await _factory.CreateTenantAsync("acme-list");
        Guid globexId = await _factory.CreateTenantAsync("globex-list");

        await AddEmployeeAsync(acmeId, "Akram Hossain", "EMP-1024", "akram@acme-list.test");
        await AddEmployeeAsync(globexId, "Not Yours", "EMP-9999", "nope@globex-list.test");

        HttpClient acme = _factory.CreateClientFor(acmeId);
        EmployeePage? page = await acme.GetFromJsonAsync<EmployeePage>(
            new Uri("/api/employees", UriKind.Relative),
            cancellationToken);

        page.ShouldNotBeNull();
        page.TotalCount.ShouldBe(1);
        page.Items.ShouldHaveSingleItem().EmployeeNumber.ShouldBe("EMP-1024");
    }

    [Fact]
    public async Task Create_adds_an_employee_to_the_current_tenant()
    {
        CancellationToken cancellationToken = TestContext.Current.CancellationToken;
        Guid tenantId = await _factory.CreateTenantAsync("create-employee");
        HttpClient client = _factory.CreateClientFor(tenantId);

        HttpResponseMessage created = await client.PostAsJsonAsync(
            new Uri("/api/employees", UriKind.Relative),
            new
            {
                fullName = "Farhana Ahmed",
                workEmail = "farhana.a@create.test",
                employeeNumber = "EMP-1049",
                departmentName = "Engineering",
                title = "Software Engineer",
                location = "Dhaka HQ",
                phone = "+880 1700-000000",
                hoursLabel = "09:00–18:00",
                managerName = "Nadia Chowdhury",
            },
            cancellationToken);

        created.StatusCode.ShouldBe(HttpStatusCode.Created);

        EmployeePage? page = await client.GetFromJsonAsync<EmployeePage>(
            new Uri("/api/employees", UriKind.Relative),
            cancellationToken);

        page!.TotalCount.ShouldBe(1);
        page.Items[0].FullName.ShouldBe("Farhana Ahmed");
        page.Items[0].EmployeeNumber.ShouldBe("EMP-1049");
    }

    private async Task AddEmployeeAsync(Guid tenantId, string fullName, string employeeNumber, string workEmail)
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantScopes = scope.ServiceProvider.GetRequiredService<ITenantScopeFactory>();

        using (tenantScopes.BeginScope(tenantId))
        {
            dbContext.Employees.Add(Employee.Create(fullName, employeeNumber, workEmail));
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
    }

    private sealed record EmployeeResponse(
        Guid Id,
        string FullName,
        string EmployeeNumber,
        string WorkEmail,
        string Title,
        string DepartmentName,
        string Location,
        string ManagerName,
        DateOnly StartedOn,
        string HoursLabel,
        string WorkingDaysLabel,
        string TimeZone,
        string EmergencyContact,
        string EmploymentType);

    private sealed record EmployeePage(
        IReadOnlyList<EmployeeResponse> Items,
        int Page,
        int PageSize,
        int TotalCount);

    private sealed record ProblemResponse(string? Title, string? Detail, int? Status);
}
