using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Organization;

/// <summary>
/// Tenant-owned workplace record. One row per company. Plan and seat fields are
/// provisioned defaults and stay read-only on the admin Organization page.
/// </summary>
public sealed class OrganizationProfile : ITenantScoped, IAuditable
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public required string DisplayName { get; set; }

    public required string WorkEmail { get; set; }

    public required string SupportHotline { get; set; }

    public required string OfficeLandline { get; set; }

    public required string WebsiteUrl { get; set; }

    public required string Industry { get; set; }

    public required string FiscalYear { get; set; }

    public required string WorkingDays { get; set; }

    public required string ShiftTiming { get; set; }

    public required string OfficeFloors { get; set; }

    public required string LegalName { get; set; }

    public required string ClientCode { get; set; }

    public required string SubscriptionTier { get; set; }

    public required string ContractPeriod { get; set; }

    public int SeatLimit { get; set; }

    public required string RegionTimeZone { get; set; }

    public required string SupportSla { get; set; }

    public required string RegisteredOffice { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }

    /// <summary>
    /// Contact and workplace defaults from the session company. Plan fields are
    /// locked placeholders until platform provisioning has a screen.
    /// </summary>
    public static OrganizationProfile CreateDefaults(string companyName, string slug)
    {
        string name = companyName.Trim();
        string code = slug.Trim().ToUpperInvariant();

        return new OrganizationProfile
        {
            Id = Guid.CreateVersion7(),
            DisplayName = name,
            WorkEmail = string.Empty,
            SupportHotline = string.Empty,
            OfficeLandline = string.Empty,
            WebsiteUrl = string.Empty,
            Industry = string.Empty,
            FiscalYear = "January – December",
            WorkingDays = "Mon,Tue,Wed,Thu,Fri",
            ShiftTiming = "09:00 AM – 06:00 PM (1h lunch)",
            OfficeFloors = string.Empty,
            LegalName = name,
            ClientCode = code,
            SubscriptionTier = "Standard",
            ContractPeriod = "—",
            SeatLimit = 100,
            RegionTimeZone = "UTC",
            SupportSla = "—",
            RegisteredOffice = string.Empty,
        };
    }
}
