using Cloudesh.Api.Startup;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Common.Errors;
using Cloudesh.Application.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Persistence, tenancy, cookie auth, request validation, and health checks.
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Off unless origins are configured. In development the SPA reaches the API through
// the Vite dev proxy, which makes requests same-origin and needs no CORS at all.
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

app.UseExceptionHandler();

if (allowedOrigins.Length > 0)
{
    app.UseCors();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

// Discovers and maps every IEndpointGroup, so features are never wired up here.
app.MapFeatureEndpoints();

await app.InitializeDatabaseAsync();

await app.RunAsync();
