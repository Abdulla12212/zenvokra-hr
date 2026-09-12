using Cloudesh.Application.Infrastructure.Auth;
using Cloudesh.Application.Infrastructure.Persistence;
using Cloudesh.Application.Infrastructure.Persistence.Interceptors;
using Cloudesh.Application.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Cloudesh.Application.Infrastructure;

/// <summary>
/// Registers persistence, tenancy, and cookie authentication. The API host calls
/// this once; nothing else should register these services.
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

        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection(DatabaseOptions.SectionName))
            .ValidateOnStart();

        services.AddOptions<PlatformAdminOptions>()
            .Bind(configuration.GetSection(PlatformAdminOptions.SectionName));

        services.TryAddSingleton(TimeProvider.System);
        services.AddHttpContextAccessor();

        // One instance per request, shared by ITenantContext and ITenantScopeFactory,
        // so opening a tenant scope also changes what the DbContext filter sees.
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<TenantContext>());
        services.AddScoped<ITenantScopeFactory>(provider => provider.GetRequiredService<TenantContext>());

        services.AddScoped<AuditableSaveChangesInterceptor>();
        services.AddScoped<TenantSaveChangesInterceptor>();

        AddCookieAuthentication(services, environment);
        AddDbContext(services, configuration, environment);

        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<DatabaseInitializer>();

        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

        // Called here — not from Program.cs — so the validation source generator
        // discovers request records in this assembly. AddValidation() in the host
        // project alone never sees those types, and annotations would be ignored.
        services.AddValidation();

        return services;
    }

    private static void AddCookieAuthentication(IServiceCollection services, IHostEnvironment environment)
    {
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "cloudesh.session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = environment.IsProduction()
                    ? CookieSecurePolicy.Always
                    : CookieSecurePolicy.SameAsRequest;
                options.SlidingExpiration = true;
                options.ExpireTimeSpan = TimeSpan.FromHours(12);

                // APIs must not redirect to a login page.
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });

        services.AddAuthorization();
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
}
