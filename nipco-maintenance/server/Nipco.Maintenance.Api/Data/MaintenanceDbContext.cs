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

        modelBuilder.Entity<EquipmentGroup>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Equipment>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<Equipment>().HasIndex(x => x.QrCode).IsUnique();
        modelBuilder.Entity<Equipment>()
            .HasOne(x => x.Group).WithMany(x => x.Equipment)
            .HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CheckItemGroup>().HasKey(x => new { x.CheckItemId, x.EquipmentGroupId });
        modelBuilder.Entity<CheckItemGroup>()
            .HasOne(x => x.CheckItem).WithMany(x => x.Groups)
            .HasForeignKey(x => x.CheckItemId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CheckItemGroup>()
            .HasOne(x => x.EquipmentGroup).WithMany(x => x.CheckItems)
            .HasForeignKey(x => x.EquipmentGroupId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DailyInspection>()
            .HasOne(x => x.Equipment).WithMany()
            .HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<DailyInspection>()
            .HasOne(x => x.Technician).WithMany()
            .HasForeignKey(x => x.TechnicianId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<DailyInspection>().HasIndex(x => new { x.EquipmentId, x.Date, x.ShiftId });

        modelBuilder.Entity<InspectionResult>()
            .HasOne(x => x.DailyInspection).WithMany(x => x.Results)
            .HasForeignKey(x => x.DailyInspectionId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<InspectionResult>()
            .HasOne(x => x.CheckItem).WithMany()
            .HasForeignKey(x => x.CheckItemId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AuditLog>().HasIndex(x => x.CreatedAt);
        modelBuilder.Entity<AuditLog>().Property(x => x.Details).HasMaxLength(2000);
    }
}