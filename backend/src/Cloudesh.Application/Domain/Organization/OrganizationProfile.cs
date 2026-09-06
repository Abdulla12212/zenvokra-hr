using Cloudesh.Application.Domain.Common;

namespace Cloudesh.Application.Domain.Organization;

/// <summary>
/// The current tenant's organization record. One row per tenant. Plan fields are
/// seeded (platform-owner provisioning has no screen yet) and must stay read-only
/// on the admin Organization Profile.
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

    public static OrganizationProfile CreateAcme() => new()
    {
        Id = Guid.CreateVersion7(),
        DisplayName = "Acme Consulting",
        WorkEmail = "hr@acmeconsulting.test",
        SupportHotline = "+880 2-55000000",
        OfficeLandline = "+880 2-55000001",
        WebsiteUrl = "https://acmeconsulting.test",
        Industry = "Professional services",
        FiscalYear = "July – June",
        WorkingDays = "Mon,Tue,Wed,Thu,Fri",
        ShiftTiming = "09:00 AM – 06:00 PM (1h lunch)",
        OfficeFloors = "Level 4, Level 5, Ground reception",
        LegalName = "Acme Consulting Ltd.",
        ClientCode = "ACME-BD-2024",
        SubscriptionTier = "Enterprise Dedicated",
        ContractPeriod = "15 Jan 2024 – 14 Jan 2027",
        SeatLimit = 100,
        RegionTimeZone = "Asia/Dhaka",
        SupportSla = "Business hours · 8h response",
        RegisteredOffice = "Dhaka HQ, Floors 4 & 5",
    };
}
