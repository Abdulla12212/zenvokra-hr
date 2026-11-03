using System.Globalization;
using System.Text;

namespace Zenvokra.Application.Domain.Tenants;

/// <summary>
/// Builds a URL-safe slug from a company name.
/// </summary>
public static class TenantSlug
{
    public const int MaxLength = 100;

    public static string FromName(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var builder = new StringBuilder(name.Length);
        bool pendingHyphen = false;

        foreach (char character in name.Trim().ToLowerInvariant())
        {
            if (char.IsAsciiLetterOrDigit(character))
            {
                if (pendingHyphen && builder.Length > 0)
                {
                    builder.Append('-');
                }

                builder.Append(character);
                pendingHyphen = false;
                continue;
            }

            if (builder.Length > 0)
            {
                pendingHyphen = true;
            }
        }

        string slug = builder.ToString();
        return slug.Length == 0 ? "company" : Truncate(slug);
    }

    public static string WithSuffix(string baseSlug, int suffix)
    {
        string suffixText = suffix.ToString(CultureInfo.InvariantCulture);
        int budget = MaxLength - suffixText.Length - 1;
        string trimmed = budget < baseSlug.Length ? Truncate(baseSlug, budget) : baseSlug;
        return $"{trimmed}-{suffixText}";
    }

    private static string Truncate(string slug, int maxLength = MaxLength)
    {
        if (maxLength < 1)
        {
            return "c";
        }

        if (slug.Length <= maxLength)
        {
            return slug;
        }

        return slug[..maxLength].TrimEnd('-');
    }
}
