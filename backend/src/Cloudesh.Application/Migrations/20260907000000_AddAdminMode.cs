using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cloudesh.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "decision_note",
                table: "leave_requests",
                type: "character varying(400)",
                maxLength: 400,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "desk_label",
                table: "employees",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "is_admin",
                table: "employees",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "phone",
                table: "employees",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "employees",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.AddColumn<string>(
                name: "team_name",
                table: "employees",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "organization_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    work_email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    support_hotline = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    office_landline = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    website_url = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    industry = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    fiscal_year = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    working_days = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    shift_timing = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    office_floors = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    legal_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    client_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    subscription_tier = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    contract_period = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    seat_limit = table.Column<int>(type: "integer", nullable: false),
                    region_time_zone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    support_sla = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    registered_office = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_organization_profiles_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "punch_corrections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    recorded_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    requested_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    note = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    manager_verified = table.Column<bool>(type: "boolean", nullable: false),
                    decision_note = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    sent_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    decided_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_punch_corrections", x => x.id);
                    table.ForeignKey(
                        name: "fk_punch_corrections_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_punch_corrections_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_employees_tenant_id_work_email",
                table: "employees",
                columns: new[] { "tenant_id", "work_email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_organization_profiles_tenant_id",
                table: "organization_profiles",
                column: "tenant_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_punch_corrections_employee_id",
                table: "punch_corrections",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_punch_corrections_tenant_id_employee_id_date",
                table: "punch_corrections",
                columns: new[] { "tenant_id", "employee_id", "date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_profiles");

            migrationBuilder.DropTable(
                name: "punch_corrections");

            migrationBuilder.DropIndex(
                name: "ix_employees_tenant_id_work_email",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "decision_note",
                table: "leave_requests");

            migrationBuilder.DropColumn(
                name: "desk_label",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "is_admin",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "phone",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "status",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "team_name",
                table: "employees");
        }
    }
}
