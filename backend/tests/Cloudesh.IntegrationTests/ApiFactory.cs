using Cloudesh.Api;
using Cloudesh.Application.Domain.Tenants;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace Cloudesh.IntegrationTests;

/// <summary>
/// Boots the real API against a throwaway PostgreSQL container.
/// </summary>
/// <remarks>
/// Nothing is stubbed: the same DI graph, the same migrations, the same interceptors,
/// and the same database engine as production. That is the point — an in-memory
/// provider cannot tell you whether a unique index or a query filter actually works.
/// <para>Requires a reachable Docker daemon. See the README if these tests fail to start.</para>
/// </remarks>
public sealed class ApiFactory : WebApplicationFactory<ApiAssemblyMarker>, IAsyncLifetime
{
    public const string TenantHeader = "X-Tenant-Id";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:18-alpine")
        .WithDatabase("cloudesh_hr_tests")
        .WithUsername("cloudesh")
        .WithPassword("cloudesh")
        .Build();

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        // Touching Services forces the host to build, which applies migrations.
        _ = Services;
    }

    /// <summary>Creates a tenant and returns a client that acts on its behalf.</summary>
    public async Task<HttpClient> CreateClientForNewTenantAsync(string slug)
    {
        Guid tenantId = await CreateTenantAsync(slug);
        return CreateClientFor(tenantId);
    }

    public HttpClient CreateClientFor(Guid tenantId)
    {
        HttpClient client = CreateClient();
        client.DefaultRequestHeaders.Add(TenantHeader, tenantId.ToString());
        return client;
    }

    public async Task<Guid> CreateTenantAsync(string slug)
    {
        using IServiceScope scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Tenant tenant = Tenant.Create(slug, $"{slug}-{Guid.CreateVersion7():N}");
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync();

        return tenant.Id;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        // Not "Development", so appsettings.Development.json — with its localhost
        // connection string and default-tenant fallback — is never loaded. Every test
        // names its own tenant, so a silent fallback would only hide bugs where the
        // header never reaches the server.
        builder.UseEnvironment("IntegrationTests");

        // Added after the host's own sources, so these win over appsettings.json.
        builder.ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["Database:MigrateOnStartup"] = "true",
                ["Database:SeedOnStartup"] = "false",
            }));
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}
