using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Nipco.Maintenance.Api.Data;

public sealed class MaintenanceDbContext(DbContextOptions<MaintenanceDbContext> options)
    : IdentityDbContext<AppUser>(options)
{
    public DbSet<EquipmentGroup> EquipmentGroups => Set<EquipmentGroup>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<CheckItem> CheckItems => Set<CheckItem>();
    public DbSet<CheckItemGroup> CheckItemGroups => Set<CheckItemGroup>();
    public DbSet<DailyInspection> DailyInspections => Set<DailyInspection>();
    public DbSet<InspectionResult> InspectionResults => Set<InspectionResult>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---- Equipment groups ----
        modelBuilder.Entity<EquipmentGroup>(e =>
        {
            e.ToTable("EquipmentGroups");
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Color).HasDefaultValue("#2563eb");
            e.Property(x => x.Theme).HasDefaultValue("default");
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // ---- Equipment ----
        modelBuilder.Entity<Equipment>(e =>
        {
            e.ToTable("Equipment");
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.QrCode).IsUnique();
            e.HasIndex(x => x.GroupId);
            e.Property(x => x.Type).HasDefaultValue("custom");
            e.Property(x => x.Location).HasDefaultValue("");
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.Group).WithMany(x => x.Equipment)
                .HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Checklist ----
        modelBuilder.Entity<CheckItem>(e =>
        {
            e.ToTable("CheckItems");
            e.Property(x => x.Type).HasDefaultValue("boolean");
            e.Property(x => x.IsRequired).HasDefaultValue(true);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.SortOrder).HasDefaultValue(0);
            e.Property(x => x.MinValue).HasPrecision(10, 2);
            e.Property(x => x.MaxValue).HasPrecision(10, 2);
        });

        modelBuilder.Entity<CheckItemGroup>(e =>
        {
            e.ToTable("CheckItemGroups");
            e.HasKey(x => new { x.CheckItemId, x.EquipmentGroupId });
            e.HasIndex(x => x.EquipmentGroupId);
            e.HasOne(x => x.CheckItem).WithMany(x => x.Groups)
                .HasForeignKey(x => x.CheckItemId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.EquipmentGroup).WithMany(x => x.CheckItems)
                .HasForeignKey(x => x.EquipmentGroupId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Daily inspections ----
        modelBuilder.Entity<DailyInspection>(e =>
        {
            e.ToTable("DailyInspections");
            e.HasIndex(x => new { x.EquipmentId, x.Date, x.ShiftId });
            e.HasIndex(x => x.TechnicianId);
            e.HasIndex(x => x.Date);
            e.Property(x => x.Date).HasColumnType("date");
            e.Property(x => x.ShiftId).HasDefaultValue("shift1");
            e.Property(x => x.Status).HasDefaultValue("completed");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.Equipment).WithMany()
                .HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Technician).WithMany()
                .HasForeignKey(x => x.TechnicianId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Inspection results ----
        modelBuilder.Entity<InspectionResult>(e =>
        {
            e.ToTable("InspectionResults");
            e.Property(x => x.Status).HasDefaultValue("needs_review");
            e.Property(x => x.Value).HasPrecision(10, 2);
            e.Property(x => x.TechnicianId).HasDefaultValue("");
            e.Property(x => x.Timestamp).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasOne(x => x.DailyInspection).WithMany(x => x.Results)
                .HasForeignKey(x => x.DailyInspectionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CheckItem).WithMany()
                .HasForeignKey(x => x.CheckItemId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Audit log ----
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("AuditLogs");
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // ---- Identity overrides (extra columns already created by the SQL script) ----
        modelBuilder.Entity<AppUser>(e =>
        {
            e.ToTable("AspNetUsers");
            e.Property(x => x.FullName).HasDefaultValue("");
            e.Property(x => x.PersonnelCode).HasDefaultValue("");
            e.Property(x => x.Role).HasDefaultValue("Technician");
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityRole>().ToTable("AspNetRoles");
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>>().ToTable("AspNetRoleClaims");
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityUserClaim<string>>().ToTable("AspNetUserClaims");
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityUserLogin<string>>().ToTable("AspNetUserLogins");
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityUserToken<string>>().ToTable("AspNetUserTokens");
        modelBuilder.Entity<Microsoft.AspNetCore.Identity.IdentityUserRole<string>>().ToTable("AspNetUserRoles");
    }
}
