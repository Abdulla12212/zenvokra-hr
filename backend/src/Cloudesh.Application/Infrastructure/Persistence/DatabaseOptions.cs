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
    /// Convenient locally. Two production replicas starting at once race each
    /// other, so leave this off once the schema exists and run pending
    /// migrations as their own job. A completely empty database (no
    /// <c>__EFMigrationsHistory</c>) is still migrated when this is false —
    /// otherwise a first Render+Neon deploy boots with no tables.
    /// </remarks>
    public bool MigrateOnStartup { get; set; }

    /// <summary>Inserts demo data when the application starts, if the database is empty.</summary>
    public bool SeedOnStartup { get; set; }
}
