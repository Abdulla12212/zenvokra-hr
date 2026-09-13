using Cloudesh.Application.Domain.Approvals;
using Cloudesh.Application.Domain.Employees;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

internal sealed class PunchCorrectionConfiguration : IEntityTypeConfiguration<PunchCorrection>
{
    public void Configure(EntityTypeBuilder<PunchCorrection> builder)
    {
        builder.HasKey(correction => correction.Id);
        builder.Property(correction => correction.Id).ValueGeneratedNever();

        builder.Property(correction => correction.Note).HasMaxLength(400).IsRequired();
        builder.Property(correction => correction.Status).HasMaxLength(32).IsRequired();
        builder.Property(correction => correction.DecisionNote).HasMaxLength(400).IsRequired();

        builder.HasIndex(correction => new { correction.TenantId, correction.EmployeeId, correction.Date });

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(correction => correction.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(correction => correction.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
