using Zenvokra.Api.Startup;
using Zenvokra.Application.Common.Endpoints;
using Zenvokra.Application.Common.Errors;
using Zenvokra.Application.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.ListenOnPlatformPort();

// Persistence, tenancy, cookie auth, request validation, and health checks.
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddForwardedHeadersBehindProxy();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Off unless origins are configured. In development the SPA reaches the API through
// the Vite dev proxy, which makes requests same-origin and needs no CORS at all.
// The Render image also serves the SPA from this process, so CORS stays off there.
string[] allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

if (allowedOrigins.Length > 0)
{
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));
}

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();

if (allowedOrigins.Length > 0)
{
    app.UseCors();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseSpaStaticFiles();

app.MapPlatformHealthChecks();

// Discovers and maps every IEndpointGroup, so features are never wired up here.
app.MapFeatureEndpoints();
app.MapSpaFallback();

await app.InitializeDatabaseAsync();

await app.RunAsync();
