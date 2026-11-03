using Microsoft.Extensions.Configuration;
using Npgsql;
using Shouldly;
using Xunit;
using Zenvokra.Application.Infrastructure.Persistence;

namespace Zenvokra.UnitTests.Persistence;

public sealed class DatabaseConnectionStringTests
{
    [Fact]
    public void Resolve_prefers_the_named_connection_string()
    {
        IConfiguration config = Config(
            ("ConnectionStrings:Default", "Host=localhost;Database=hr;Username=u;Password=p"),
            ("DATABASE_URL", "postgres://neon:secret@ep-demo.us-east-2.aws.neon.tech/neondb"));

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionString.Resolve(config));

        builder.Host.ShouldBe("localhost");
        builder.Database.ShouldBe("hr");
    }

    [Fact]
    public void Resolve_falls_back_to_database_url()
    {
        IConfiguration config = Config(
            ("DATABASE_URL", "postgres://neon:s3cret@ep-demo.us-east-2.aws.neon.tech/neondb"));

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionString.Resolve(config));

        builder.Host.ShouldBe("ep-demo.us-east-2.aws.neon.tech");
        builder.Username.ShouldBe("neon");
        builder.Password.ShouldBe("s3cret");
        builder.Database.ShouldBe("neondb");
        builder.SslMode.ShouldBe(SslMode.Require);
    }

    [Fact]
    public void Resolve_treats_an_empty_named_string_as_missing()
    {
        IConfiguration config = Config(
            ("ConnectionStrings:Default", ""),
            ("DATABASE_URL", "postgresql://neon:s3cret@ep-demo.eu-central-1.aws.neon.tech/neondb?sslmode=require"));

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionString.Resolve(config));

        builder.Host.ShouldBe("ep-demo.eu-central-1.aws.neon.tech");
    }

    [Fact]
    public void Resolve_throws_when_nothing_is_configured()
    {
        IConfiguration config = Config();

        Should.Throw<InvalidOperationException>(() => DatabaseConnectionString.Resolve(config))
            .Message.ShouldContain("DATABASE_URL");
    }

    [Fact]
    public void Normalize_leaves_local_postgres_ssl_alone()
    {
        var builder = new NpgsqlConnectionStringBuilder(
            DatabaseConnectionString.Normalize(
                "Host=postgres;Port=5432;Database=zenvokra_hr;Username=zenvokra;Password=dev"));

        builder.SslMode.ShouldBe(SslMode.Prefer);
        builder.NoResetOnClose.ShouldBeFalse();
    }

    [Fact]
    public void Normalize_enables_tls_and_pooler_safe_flags_for_neon()
    {
        var builder = new NpgsqlConnectionStringBuilder(
            DatabaseConnectionString.Normalize(
                "postgres://neon:s3cret@ep-demo-pooler.us-east-2.aws.neon.tech/neondb"));

        builder.SslMode.ShouldBe(SslMode.Require);
        builder.NoResetOnClose.ShouldBeTrue();
        builder.MaxAutoPrepare.ShouldBe(0);
    }

    [Fact]
    public void Normalize_reads_ssl_and_channel_binding_from_the_uri()
    {
        var builder = new NpgsqlConnectionStringBuilder(
            DatabaseConnectionString.Normalize(
                "postgresql://neon:s3cret@ep-demo.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"));

        builder.SslMode.ShouldBe(SslMode.VerifyFull);
        builder.ChannelBinding.ShouldBe(ChannelBinding.Require);
    }

    [Fact]
    public void Normalize_does_not_downgrade_verify_full()
    {
        var builder = new NpgsqlConnectionStringBuilder(
            DatabaseConnectionString.Normalize(
                "Host=ep-demo.us-east-2.aws.neon.tech;Database=neondb;Username=neon;Password=s3cret;SSL Mode=VerifyFull"));

        builder.SslMode.ShouldBe(SslMode.VerifyFull);
    }

    [Fact]
    public void ForMigrations_strips_the_neon_pooler_label()
    {
        string runtime = DatabaseConnectionString.Normalize(
            "postgres://neon:s3cret@ep-cool-darkness-a1b2c3d4-pooler.us-east-2.aws.neon.tech/neondb");

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionString.ForMigrations(runtime));

        builder.Host.ShouldBe("ep-cool-darkness-a1b2c3d4.us-east-2.aws.neon.tech");
        builder.NoResetOnClose.ShouldBeFalse();
    }

    [Fact]
    public void ResolveForMigrations_uses_the_unpooled_url_when_set()
    {
        IConfiguration config = Config(
            ("DATABASE_URL", "postgres://neon:s3cret@ep-demo-pooler.us-east-2.aws.neon.tech/neondb"),
            ("DATABASE_URL_UNPOOLED", "postgres://neon:s3cret@ep-direct.us-east-2.aws.neon.tech/neondb"));

        var builder = new NpgsqlConnectionStringBuilder(
            DatabaseConnectionString.ResolveForMigrations(config));

        builder.Host.ShouldBe("ep-direct.us-east-2.aws.neon.tech");
    }

    [Fact]
    public void FromConfiguration_keeps_runtime_on_the_pooler()
    {
        IConfiguration config = Config(
            ("DATABASE_URL", "postgres://neon:s3cret@ep-demo-pooler.us-east-2.aws.neon.tech/neondb"));

        DatabaseConnections connections = DatabaseConnections.FromConfiguration(config);

        new NpgsqlConnectionStringBuilder(connections.Runtime).Host
            .ShouldBe("ep-demo-pooler.us-east-2.aws.neon.tech");
        new NpgsqlConnectionStringBuilder(connections.Migrations).Host
            .ShouldBe("ep-demo.us-east-2.aws.neon.tech");
    }

    private static IConfiguration Config(params (string Key, string Value)[] pairs)
    {
        var values = pairs.ToDictionary(pair => pair.Key, pair => (string?)pair.Value);
        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }
}
