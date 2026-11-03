using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zenvokra.Application.Domain.Employees;
using Zenvokra.Application.Domain.Identity;
using Zenvokra.Application.Domain.Tenants;

namespace Zenvokra.Application.Infrastructure.Persistence.Configurations;

internal sealed class EmployeeAccountConfiguration : IEntityTypeConfiguration<EmployeeAccount>
{
    public void Configure(EntityTypeBuilder<EmployeeAccount> builder)
    {
        builder.HasKey(account => account.Id);
        builder.Property(account => account.Id).ValueGeneratedNever();

        builder.Property(account => account.Email)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(account => account.Password)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(account => account.Email).IsUnique();

        // Leading with TenantId matches how every query filters, and doubles as the
        // index EF would otherwise create for the foreign key below.
        builder.HasIndex(account => new { account.TenantId, account.Email }).IsUnique();
        builder.HasIndex(account => account.EmployeeId).IsUnique();

        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(account => account.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(account => account.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
