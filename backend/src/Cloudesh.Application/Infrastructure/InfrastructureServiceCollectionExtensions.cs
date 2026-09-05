using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Persistence.Interceptors;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Cloudesh.Application.Infrastructure;

/// <summary>
/// Registers persistence and tenancy. The API host calls this once; nothing else
/// should register these services.
/// </summary>
public static class InfrastructureServiceCollectionExtensions
{
    public const string ConnectionStringName = "Default";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        services.AddOptions<TenancyOptions>()
            .Bind(configuration.GetSection(TenancyOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection(DatabaseOptions.SectionName))
            .ValidateOnStart();

        GuardAgainstDefaultTenantOutsideDevelopment(configuration, environment);

        services.TryAddSingleton(TimeProvider.System);
        services.AddHttpContextAccessor();

        // One instance per request, shared by ITenantContext and ITenantScopeFactory,
        // so opening a tenant scope also changes what the DbContext filter sees.
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<TenantContext>());
        services.AddScoped<ITenantScopeFactory>(provider => provider.GetRequiredService<TenantContext>());

        services.AddScoped<AuditableSaveChangesInterceptor>();
        services.AddScoped<TenantSaveChangesInterceptor>();

        AddDbContext(services, configuration, environment);

        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DatabaseInitializer>();

        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

        return services;
    }

    private static void AddDbContext(
        IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        string? connectionString = configuration.GetConnectionString(ConnectionStringName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{ConnectionStringName}' is missing. Set ConnectionStrings__{ConnectionStringName} " +
                "in the environment, or add it to appsettings.Development.json.");
        }

        services.AddDbContext<AppDbContext>((provider, options) =>
        {
            options.UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(3));

            // Maps PascalCase properties to snake_case columns, so psql sessions and
            // hand-written SQL never need quoted identifiers.
            options.UseSnakeCaseNamingConvention();

            // Order matters: auditing stamps timestamps, then tenancy validates
            // ownership on the final state of each entry.
            options.AddInterceptors(
                provider.GetRequiredService<AuditableSaveChangesInterceptor>(),
                provider.GetRequiredService<TenantSaveChangesInterceptor>());

            if (environment.IsDevelopment())
            {
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging();
            }
        });
    }

    /// <summary>
    /// A deployed API that quietly falls back to some default tenant would serve one
    /// customer's data to anyone who forgets a header. Refuse to start instead.
    /// </summary>
    private static void GuardAgainstDefaultTenantOutsideDevelopment(
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            return;
        }

        var tenancy = configuration.GetSection(TenancyOptions.SectionName).Get<TenancyOptions>();

        // An empty config value binds as Guid.Empty, which is not a tenant fallback.
        if (tenancy?.DefaultTenantId is Guid tenantId && tenantId != Guid.Empty)
        {
            throw new InvalidOperationException(
                $"Tenancy:DefaultTenantId is set in the '{environment.EnvironmentName}' environment. " +
                "It is a development-only fallback for requests that carry no tenant header and must be " +
                "removed outside Development.");
        }
    }
}
