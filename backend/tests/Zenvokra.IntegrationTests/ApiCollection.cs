using Xunit;

namespace Zenvokra.IntegrationTests;

/// <summary>
/// One <see cref="ApiFactory"/> for the whole assembly so tests share a single
/// Testcontainer and do not race to start three copies of PostgreSQL.
/// </summary>
[CollectionDefinition(Name)]
public sealed class SharedApi : ICollectionFixture<ApiFactory>
{
    public const string Name = "api";
}
