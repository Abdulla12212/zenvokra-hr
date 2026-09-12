using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

internal sealed class TenantAdminConfiguration : IEntityTypeConfiguration<TenantAdmin>
{
    public void Configure(EntityTypeBuilder<TenantAdmin> builder)
    {
        builder.HasKey(admin => admin.Id);
        builder.Property(admin => admin.Id).ValueGeneratedNever();

        builder.Property(admin => admin.Email)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(admin => admin.Password)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(admin => admin.Email).IsUnique();

        // Leading with TenantId matches how every query filters, and doubles as the
        // index EF would otherwise create for the foreign key below.
        builder.HasIndex(admin => new { admin.TenantId, admin.Email }).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(admin => admin.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
