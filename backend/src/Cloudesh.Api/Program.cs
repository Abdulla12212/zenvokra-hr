using Cloudesh.Api.Startup;
using Cloudesh.Application.Common.Endpoints;
using Cloudesh.Application.Common.Errors;
using Cloudesh.Application.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Persistence, tenancy, and health checks.
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

// Validates request models from their data annotations before handlers run, so no
// handler starts with a block of null and length checks. Uses source-generated
// validators where available (see InterceptorsNamespaces in the .csproj files) and
// falls back to reflection otherwise.
builder.Services.AddValidation();

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
        .AllowAnyMethod()));
}

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    // Serves the OpenAPI document at /openapi/v1.json. Development only: the schema
    // of an unauthenticated API is not something to publish.
    app.MapOpenApi();
}

if (allowedOrigins.Length > 0)
{
    app.UseCors();
}

app.MapHealthChecks("/health");

// Discovers and maps every IEndpointGroup, so features are never wired up here.
app.MapFeatureEndpoints();

await app.InitializeDatabaseAsync();

await app.RunAsync();
