using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zenvokra.Application.Migrations;

/// <inheritdoc />
public partial class AddAttendanceSessionWorked : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<TimeOnly>(
            name: "open_since",
            table: "attendance_days",
            type: "time without time zone",
            nullable: true);

        migrationBuilder.AddColumn<TimeSpan>(
            name: "prior_worked",
            table: "attendance_days",
            type: "interval",
            nullable: false,
            defaultValue: new TimeSpan(0, 0, 0, 0, 0));
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "open_since",
            table: "attendance_days");

        migrationBuilder.DropColumn(
            name: "prior_worked",
            table: "attendance_days");
    }
}
