using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zenvokra.Application.Domain.Holidays;
using Zenvokra.Application.Domain.Tenants;

namespace Zenvokra.Application.Infrastructure.Persistence.Configurations;

internal sealed class CompanyHolidayConfiguration : IEntityTypeConfiguration<CompanyHoliday>
{
    public void Configure(EntityTypeBuilder<CompanyHoliday> builder)
    {
        builder.HasKey(holiday => holiday.Id);
        builder.Property(holiday => holiday.Id).ValueGeneratedNever();

        builder.Property(holiday => holiday.Name).HasMaxLength(200).IsRequired();
        builder.Property(holiday => holiday.Detail).HasMaxLength(200).IsRequired();

        builder.HasIndex(holiday => new { holiday.TenantId, holiday.Date }).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(holiday => holiday.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
