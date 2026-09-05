using System.Net;
using System.Net.Http.Json;
using Shouldly;
using Xunit;

namespace Cloudesh.IntegrationTests;

/// <summary>
/// Exercises the walking-skeleton feature over real HTTP against real PostgreSQL.
/// </summary>
/// <remarks>
/// WALKING SKELETON: delete alongside the Departments feature, but keep the shape —
/// every feature should get an isolation test like
/// <see cref="Two_tenants_never_see_each_others_departments"/>.
/// </remarks>
public sealed class DepartmentsEndpointsTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public DepartmentsEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Health_check_reports_the_database_is_reachable()
    {
        HttpClient client = _factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).ShouldBe("Healthy");
    }

    [Fact]
    public async Task A_request_without_a_tenant_header_is_rejected()
    {
        HttpClient client = _factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/api/departments", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

        ProblemResponse? problem = await response.Content.ReadFromJsonAsync<ProblemResponse>();
        problem.ShouldNotBeNull();
        problem.Detail.ShouldNotBeNull();
        problem.Detail.ShouldContain(ApiFactory.TenantHeader);
    }

    [Fact]
    public async Task A_created_department_comes_back_from_the_list()
    {
        HttpClient client = await _factory.CreateClientForNewTenantAsync("create-and-list");

        HttpResponseMessage created = await client.PostAsJsonAsync(
            new Uri("/api/departments", UriKind.Relative),
            new { name = "Engineering" });

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        created.Headers.Location.ShouldNotBeNull();

        DepartmentPage? page = await client.GetFromJsonAsync<DepartmentPage>(
            new Uri("/api/departments", UriKind.Relative));

        page!.TotalCount.ShouldBe(1);
        page.Items.ShouldHaveSingleItem().Name.ShouldBe("Engineering");
    }

    [Fact]
    public async Task Two_tenants_never_see_each_others_departments()
    {
        HttpClient acme = await _factory.CreateClientForNewTenantAsync("acme");
        HttpClient globex = await _factory.CreateClientForNewTenantAsync("globex");

        await acme.PostAsJsonAsync(new Uri("/api/departments", UriKind.Relative), new { name = "Acme Only" });
        await globex.PostAsJsonAsync(new Uri("/api/departments", UriKind.Relative), new { name = "Globex Only" });

        DepartmentPage? acmePage = await acme.GetFromJsonAsync<DepartmentPage>(
            new Uri("/api/departments", UriKind.Relative));
        DepartmentPage? globexPage = await globex.GetFromJsonAsync<DepartmentPage>(
            new Uri("/api/departments", UriKind.Relative));

        acmePage!.Items.Select(item => item.Name).ShouldBe(new[] { "Acme Only" });
        globexPage!.Items.Select(item => item.Name).ShouldBe(new[] { "Globex Only" });
    }

    [Fact]
    public async Task The_same_department_name_is_allowed_in_a_different_tenant()
    {
        HttpClient first = await _factory.CreateClientForNewTenantAsync("shared-name-a");
        HttpClient second = await _factory.CreateClientForNewTenantAsync("shared-name-b");

        var body = new { name = "People Operations" };

        (await first.PostAsJsonAsync(new Uri("/api/departments", UriKind.Relative), body))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
        (await second.PostAsJsonAsync(new Uri("/api/departments", UriKind.Relative), body))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task A_duplicate_name_within_one_tenant_conflicts()
    {
        HttpClient client = await _factory.CreateClientForNewTenantAsync("duplicates");
        var body = new { name = "Finance" };

        await client.PostAsJsonAsync(new Uri("/api/departments", UriKind.Relative), body);
        HttpResponseMessage second = await client.PostAsJsonAsync(
            new Uri("/api/departments", UriKind.Relative), body);

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    public async Task An_invalid_name_is_rejected_before_the_handler_runs(string name)
    {
        HttpClient client = await _factory.CreateClientForNewTenantAsync($"invalid-{name.Length}");

        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/api/departments", UriKind.Relative),
            new { name });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Page_size_is_capped_so_nobody_can_request_the_whole_table()
    {
        HttpClient client = await _factory.CreateClientForNewTenantAsync("paging");

        DepartmentPage? page = await client.GetFromJsonAsync<DepartmentPage>(
            new Uri("/api/departments?page=0&pageSize=100000", UriKind.Relative));

        page!.Page.ShouldBe(1);
        page.PageSize.ShouldBe(100);
    }

    private sealed record DepartmentPage(List<DepartmentItem> Items, int Page, int PageSize, int TotalCount);

    private sealed record DepartmentItem(Guid Id, string Name, DateTimeOffset CreatedAtUtc);

    private sealed record ProblemResponse(string? Title, string? Detail, int? Status);
}
