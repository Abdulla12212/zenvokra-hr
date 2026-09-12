using System.Net.Http.Json;
using Cloudesh.Api;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;
using Xunit;

namespace Cloudesh.IntegrationTests;

/// <summary>
/// Boots the real API against a throwaway PostgreSQL container.
/// </summary>
/// <remarks>
/// Shared by every integration test class via <see cref="SharedApi"/> so we
/// start one database, not one per fixture. Tests in a collection run sequentially.
/// </remarks>
public sealed class ApiFactory : WebApplicationFactory<ApiAssemblyMarker>, IAsyncLifetime
{
    public const string PlatformAdminEmail = "owner@cloudesh.test";
    public const string PlatformAdminPassword = "cloudesh-dev";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("cloudesh_hr_tests")
        .WithUsername("cloudesh")
        .WithPassword("cloudesh")
        .Build();

    private string? _previousConnectionString;

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        // `docker compose exec api` inherits ConnectionStrings__Default for the
        // compose Postgres. WebApplication.CreateBuilder prefers that env var
        // over ConfigureAppConfiguration, so tests would otherwise write to the
        // live database. This process-only override does not affect the API.
        _previousConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default");
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", _postgres.GetConnectionString());

        _ = Services;
    }

    public HttpClient CreateUnauthenticatedClient() =>
        CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false,
        });

    public async Task<HttpClient> CreatePlatformClientAsync()
    {
        HttpClient client = CreateUnauthenticatedClient();
        await LoginAsync(client, PlatformAdminEmail, PlatformAdminPassword);
        return client;
    }

    public async Task LoginAsync(HttpClient client, string email, string password)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            new Uri("/api/auth/login", UriKind.Relative),
            new { email, password });

        response.EnsureSuccessStatusCode();
    }

    public async Task<(Guid TenantId, Guid AdminId)> CreateTenantWithAdminAsync(
        HttpClient platformClient,
        string tenantName,
        string adminEmail,
        string adminPassword = "admin-pass")
    {
        HttpResponseMessage createdTenant = await platformClient.PostAsJsonAsync(
            new Uri("/api/platform/tenants", UriKind.Relative),
            new { name = tenantName });

        createdTenant.EnsureSuccessStatusCode();
        TenantCreated? tenant = await createdTenant.Content.ReadFromJsonAsync<TenantCreated>();
        ArgumentNullException.ThrowIfNull(tenant);

        HttpResponseMessage createdAdmin = await platformClient.PostAsJsonAsync(
            new Uri($"/api/platform/tenants/{tenant.Id}/admins", UriKind.Relative),
            new { email = adminEmail, password = adminPassword });

        createdAdmin.EnsureSuccessStatusCode();
        AdminCreated? admin = await createdAdmin.Content.ReadFromJsonAsync<AdminCreated>();
        ArgumentNullException.ThrowIfNull(admin);

        return (tenant.Id, admin.Id);
    }

    public async Task<HttpClient> CreateTenantAdminClientAsync(
        string tenantName,
        string adminEmail,
        string adminPassword = "admin-pass")
    {
        HttpClient platform = await CreatePlatformClientAsync();
        await CreateTenantWithAdminAsync(platform, tenantName, adminEmail, adminPassword);

        HttpClient tenantAdmin = CreateUnauthenticatedClient();
        await LoginAsync(tenantAdmin, adminEmail, adminPassword);
        return tenantAdmin;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        // Not "Development", so appsettings.Development.json is never loaded.
        builder.UseEnvironment("IntegrationTests");
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        // Added after the host's default sources, including the api container's
        // ConnectionStrings__Default. Without this last write, tests hit the
        // compose Postgres and collide with leftover demo rows.
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(TestSettings()));

        return base.CreateHost(builder);
    }

    private Dictionary<string, string?> TestSettings() => new()
    {
        ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
        ["Database:MigrateOnStartup"] = "true",
        ["Database:SeedOnStartup"] = "true",
        ["PlatformAdmin:Email"] = PlatformAdminEmail,
        ["PlatformAdmin:Password"] = PlatformAdminPassword,
    };

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", _previousConnectionString);
        await _postgres.DisposeAsync();
    }

    private sealed record TenantCreated(Guid Id);

    private sealed record AdminCreated(Guid Id);
}
