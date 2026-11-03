using System.Net;
using Shouldly;
using Xunit;

namespace Zenvokra.IntegrationTests;

[Collection(SharedApi.Name)]
public sealed class HealthEndpointsTests
{
    private readonly ApiFactory _factory;

    public HealthEndpointsTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Liveness_is_healthy_without_probing_the_database()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).ShouldBe("Healthy");
    }

    [Fact]
    public async Task Readiness_reports_the_database_is_reachable()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/health/ready", UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).ShouldBe("Healthy");
    }
}
