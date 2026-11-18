using Microsoft.AspNetCore.Identity;

namespace Nipco.Maintenance.Api.Data;

public sealed class AppUser : IdentityUser
{
    public string FullName { get; set; } = "";
    public string PersonnelCode { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class EquipmentGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string Color { get; set; } = "#2563eb";
    public string Theme { get; set; } = "default";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    public ICollection<CheckItemGroup> CheckItems { get; set; } = new List<CheckItemGroup>();
}

public sealed class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "custom";
    public Guid GroupId { get; set; }
    public EquipmentGroup? Group { get; set; }
    public string Location { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public string QrCode { get; set; } = "";
    public string? ImageUrl { get; set; }
    public DateTime? CommissioningDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class CheckItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "";
    public string Type { get; set; } = "boolean";
    public string? Unit { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? SectionType { get; set; }
    public int SortOrder { get; set; }
    public ICollection<CheckItemGroup> Groups { get; set; } = new List<CheckItemGroup>();
}

public sealed class CheckItemGroup
{
    public Guid CheckItemId { get; set; }
    public CheckItem? CheckItem { get; set; }
    public Guid EquipmentGroupId { get; set; }
    public EquipmentGroup? EquipmentGroup { get; set; }
}

public sealed class DailyInspection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public string TechnicianId { get; set; } = "";
    public AppUser? Technician { get; set; }
    public string ShiftId { get; set; } = "shift1";
    public DateOnly Date { get; set; }
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InspectionResult> Results { get; set; } = new List<InspectionResult>();
}

public sealed class InspectionResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DailyInspectionId { get; set; }
    public DailyInspection? DailyInspection { get; set; }
    public Guid CheckItemId { get; set; }
    public CheckItem? CheckItem { get; set; }
    public string Status { get; set; } = "needs_review";
    public decimal? Value { get; set; }
    public string? TextValue { get; set; }
    public string? Comment { get; set; }
    public string TechnicianId { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public sealed class AuditLog
{
    public long Id { get; set; }
    public string? ActorId { get; set; }
    public string Action { get; set; } = "";
    public string EntityName { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}