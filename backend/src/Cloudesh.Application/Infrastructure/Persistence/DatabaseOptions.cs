namespace Cloudesh.Application.Infrastructure.Persistence;

/// <summary>
/// Configuration for database startup behaviour. Bound from the <c>Database</c>
/// configuration section.
/// </summary>
public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>
    /// Applies pending migrations when the application starts.
    /// </summary>
    /// <remarks>
    /// Convenient locally, wrong in production: two instances starting at once race
    /// each other, and a failed migration takes the app down with it. Deployments
    /// should run migrations as their own step before rolling out new instances.
    /// </remarks>
    public bool MigrateOnStartup { get; set; }

    /// <summary>Inserts demo data when the application starts, if the database is empty.</summary>
    public bool SeedOnStartup { get; set; }
}
