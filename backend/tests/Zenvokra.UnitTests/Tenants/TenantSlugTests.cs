using Shouldly;
using Xunit;
using Zenvokra.Application.Domain.Tenants;

namespace Zenvokra.UnitTests.Tenants;

public sealed class TenantSlugTests
{
    [Theory]
    [InlineData("Acme Consulting", "acme-consulting")]
    [InlineData("  Globex  ", "globex")]
    [InlineData("A & B Co.", "a-b-co")]
    public void FromName_builds_a_url_safe_slug(string name, string expected)
    {
        TenantSlug.FromName(name).ShouldBe(expected);
    }

    [Fact]
    public void FromName_falls_back_when_nothing_usable_remains()
    {
        TenantSlug.FromName("***").ShouldBe("company");
    }

    [Fact]
    public void WithSuffix_keeps_the_slug_within_the_column_limit()
    {
        string longName = new('a', 200);

        string slug = TenantSlug.WithSuffix(TenantSlug.FromName(longName), 12);

        slug.Length.ShouldBeLessThanOrEqualTo(TenantSlug.MaxLength);
        slug.ShouldEndWith("-12");
    }
}
