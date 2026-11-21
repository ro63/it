using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace Nipco.Maintenance.Api.Data;

public sealed class AppUser : IdentityUser
{
    [MaxLength(150)] public string FullName { get; set; } = "";
    [MaxLength(20)] public string PersonnelCode { get; set; } = "";
    [MaxLength(20)] public string? Mobile { get; set; }
    /// <summary>admin | supervisor | technician | viewer</summary>
    [MaxLength(20)] public string Role { get; set; } = "Technician";
    [MaxLength(400)] public string? SectionAccessJson { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<string> SectionAccess()
    {
        if (string.IsNullOrWhiteSpace(SectionAccessJson)) return new();
        try { return JsonSerializer.Deserialize<List<string>>(SectionAccessJson) ?? new(); }
        catch { return new(); }
    }

    public void SetSectionAccess(IEnumerable<string>? sections)
    {
        var list = (sections ?? Enumerable.Empty<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct()
            .ToList();
        SectionAccessJson = list.Count == 0 ? null : JsonSerializer.Serialize(list);
    }
}

public sealed class EquipmentGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [MaxLength(100)] public string Name { get; set; } = "";
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(20)] public string Color { get; set; } = "#2563eb";
    [MaxLength(20)] public string Theme { get; set; } = "default";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    public ICollection<CheckItemGroup> CheckItems { get; set; } = new List<CheckItemGroup>();
}

public sealed class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [MaxLength(50)] public string Code { get; set; } = "";
    [MaxLength(150)] public string Name { get; set; } = "";
    [MaxLength(30)] public string Type { get; set; } = "custom";
    public Guid GroupId { get; set; }
    public EquipmentGroup? Group { get; set; }
    [MaxLength(150)] public string Location { get; set; } = "";
    public bool IsActive { get; set; } = true;
    [MaxLength(50)] public string QrCode { get; set; } = "";
    [MaxLength(500)] public string? ImageUrl { get; set; }
    public DateTime? CommissioningDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class CheckItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [MaxLength(200)] public string Title { get; set; } = "";
    /// <summary>boolean | numeric | text</summary>
    [MaxLength(20)] public string Type { get; set; } = "boolean";
    [MaxLength(20)] public string? Unit { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
    [MaxLength(30)] public string? SectionType { get; set; }
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
    [MaxLength(450)] public string TechnicianId { get; set; } = "";
    public AppUser? Technician { get; set; }
    /// <summary>shift1 | shift2 | shift3</summary>
    [MaxLength(20)] public string ShiftId { get; set; } = "shift1";
    public DateOnly Date { get; set; }
    /// <summary>completed | pending | overdue</summary>
    [MaxLength(20)] public string Status { get; set; } = "completed";
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
    /// <summary>ok | nok | needs_review</summary>
    [MaxLength(20)] public string Status { get; set; } = "needs_review";
    public decimal? Value { get; set; }
    [MaxLength(500)] public string? TextValue { get; set; }
    [MaxLength(1000)] public string? Comment { get; set; }
    [MaxLength(450)] public string TechnicianId { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public sealed class AuditLog
{
    public long Id { get; set; }
    [MaxLength(450)] public string? ActorId { get; set; }
    [MaxLength(100)] public string Action { get; set; } = "";
    [MaxLength(100)] public string EntityName { get; set; } = "";
    [MaxLength(100)] public string EntityId { get; set; } = "";
    [MaxLength(2000)] public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
