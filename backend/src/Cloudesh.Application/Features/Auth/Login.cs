using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Cloudesh.Application.Domain.Identity;
using Cloudesh.Application.Infrastructure.Auth;
using Cloudesh.Application.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Cloudesh.Application.Features.Auth;

public static class Login
{
    public sealed record Request
    {
        [Required(AllowEmptyStrings = false)]
        [EmailAddress]
        [StringLength(320)]
        public string Email { get; init; } = string.Empty;

        [Required(AllowEmptyStrings = false)]
        [StringLength(200)]
        public string Password { get; init; } = string.Empty;
    }

    public static async Task<Results<Ok<SessionResponse>, ProblemHttpResult>> HandleAsync(
        Request request,
        HttpContext httpContext,
        AppDbContext dbContext,
        CancellationToken cancellationToken)
    {
        string email = LoginEmail.Normalize(request.Email);

        User? platformAdmin = await dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Email == email, cancellationToken);

        if (platformAdmin is not null)
        {
            if (platformAdmin.Password != request.Password)
            {
                return InvalidCredentials();
            }

            await SignInAsync(httpContext, platformAdmin.Id, platformAdmin.Email, UserRoles.PlatformAdmin, tenantId: null);
            return TypedResults.Ok(new SessionResponse(
                platformAdmin.Id,
                platformAdmin.Email,
                UserRoles.PlatformAdmin,
                TenantId: null,
                TenantName: null));
        }

        // Login has no tenant. Email is globally unique, so naming the filter here
        // authenticates one person rather than listing another company's members.
        TenantAdmin? tenantAdmin = await dbContext.TenantAdmins
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .SingleOrDefaultAsync(admin => admin.Email == email, cancellationToken);

        if (tenantAdmin is not null)
        {
            if (tenantAdmin.Password != request.Password)
            {
                return InvalidCredentials();
            }

            return await SignInTenantMemberAsync(
                httpContext,
                dbContext,
                tenantAdmin.Id,
                tenantAdmin.Email,
                UserRoles.TenantAdmin,
                tenantAdmin.TenantId,
                cancellationToken);
        }

        EmployeeAccount? employeeAccount = await dbContext.EmployeeAccounts
            .IgnoreQueryFilters([AppDbContext.TenantIsolationFilter])
            .AsNoTracking()
            .SingleOrDefaultAsync(account => account.Email == email, cancellationToken);

        if (employeeAccount is null || employeeAccount.Password != request.Password)
        {
            return InvalidCredentials();
        }

        return await SignInTenantMemberAsync(
            httpContext,
            dbContext,
            employeeAccount.Id,
            employeeAccount.Email,
            UserRoles.Employee,
            employeeAccount.TenantId,
            cancellationToken);
    }

    private static async Task<Results<Ok<SessionResponse>, ProblemHttpResult>> SignInTenantMemberAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        Guid userId,
        string email,
        string role,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return InvalidCredentials();
        }

        if (!tenant.IsActive)
        {
            return TypedResults.Problem(
                title: "Company inactive",
                detail: "This company is not active.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        await SignInAsync(httpContext, userId, email, role, tenant.Id);
        return TypedResults.Ok(new SessionResponse(userId, email, role, tenant.Id, tenant.Name));
    }

    private static ProblemHttpResult InvalidCredentials() =>
        TypedResults.Problem(
            title: "Unauthorized",
            detail: "Invalid email or password.",
            statusCode: StatusCodes.Status401Unauthorized);

    private static async Task SignInAsync(
        HttpContext httpContext,
        Guid userId,
        string email,
        string role,
        Guid? tenantId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role),
        };

        if (tenantId is Guid id)
        {
            claims.Add(new Claim(AuthClaims.TenantId, id.ToString()));
        }

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await httpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));
    }
}
