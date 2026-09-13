using Cloudesh.Application.Domain.Organization;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

internal sealed class OrganizationProfileConfiguration : IEntityTypeConfiguration<OrganizationProfile>
{
    public void Configure(EntityTypeBuilder<OrganizationProfile> builder)
    {
        builder.HasKey(profile => profile.Id);
        builder.Property(profile => profile.Id).ValueGeneratedNever();

        builder.Property(profile => profile.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(profile => profile.WorkEmail).HasMaxLength(320).IsRequired();
        builder.Property(profile => profile.SupportHotline).HasMaxLength(40).IsRequired();
        builder.Property(profile => profile.OfficeLandline).HasMaxLength(40).IsRequired();
        builder.Property(profile => profile.WebsiteUrl).HasMaxLength(320).IsRequired();
        builder.Property(profile => profile.Industry).HasMaxLength(120).IsRequired();
        builder.Property(profile => profile.FiscalYear).HasMaxLength(64).IsRequired();
        builder.Property(profile => profile.WorkingDays).HasMaxLength(64).IsRequired();
        builder.Property(profile => profile.ShiftTiming).HasMaxLength(80).IsRequired();
        builder.Property(profile => profile.OfficeFloors).HasMaxLength(400).IsRequired();
        builder.Property(profile => profile.LegalName).HasMaxLength(200).IsRequired();
        builder.Property(profile => profile.ClientCode).HasMaxLength(64).IsRequired();
        builder.Property(profile => profile.SubscriptionTier).HasMaxLength(80).IsRequired();
        builder.Property(profile => profile.ContractPeriod).HasMaxLength(80).IsRequired();
        builder.Property(profile => profile.RegionTimeZone).HasMaxLength(64).IsRequired();
        builder.Property(profile => profile.SupportSla).HasMaxLength(120).IsRequired();
        builder.Property(profile => profile.RegisteredOffice).HasMaxLength(200).IsRequired();

        builder.HasIndex(profile => profile.TenantId).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(profile => profile.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
