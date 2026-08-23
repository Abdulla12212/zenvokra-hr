using Cloudesh.Application.Domain.Departments;
using Cloudesh.Application.Domain.Tenants;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Cloudesh.Application.Infrastructure.Persistence.Configurations;

// WALKING SKELETON: delete alongside the Departments feature.
internal sealed class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.HasKey(department => department.Id);

        builder.Property(department => department.Id)
            .ValueGeneratedNever();

        builder.Property(department => department.Name)
            .HasMaxLength(200)
            .IsRequired();

        // Leading with TenantId matches how every query filters, and doubles as the
        // index EF would otherwise create for the foreign key below.
        builder.HasIndex(department => new { department.TenantId, department.Name })
            .IsUnique();

        // No navigation property: tenant-scoped entities reference their tenant by id
        // only, so nothing can accidentally traverse into the tenant registry. The
        // foreign key still gives the database referential integrity and makes
        // deleting a tenant remove its data.
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(department => department.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
