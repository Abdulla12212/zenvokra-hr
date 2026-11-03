using Shouldly;
using Xunit;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.UnitTests.Persistence;

public sealed class DatabaseInitializerTests
{
    [Theory]
    [InlineData(true, false, true)]
    [InlineData(true, true, true)]
    [InlineData(false, true, true)]
    [InlineData(false, false, false)]
    public void Empty_database_is_migrated_even_when_the_startup_flag_is_off(
        bool migrateOnStartup,
        bool databaseWasEmpty,
        bool expected)
    {
        DatabaseInitializer.ShouldApplyMigrations(migrateOnStartup, databaseWasEmpty).ShouldBe(expected);
    }
}
