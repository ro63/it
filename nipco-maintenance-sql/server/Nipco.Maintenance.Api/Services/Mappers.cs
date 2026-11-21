using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;

namespace Nipco.Maintenance.Api.Services;

public static class Mappers
{
    public static string RoleToApi(string role) => role.Trim().ToLowerInvariant() switch
    {
        "admin" => "admin",
        "supervisor" => "supervisor",
        "technician" => "technician",
        "viewer" => "viewer",
        _ => "technician"
    };

    public static string RoleToIdentity(string role) => role.Trim().ToLowerInvariant() switch
    {
        "admin" => "Admin",
        "supervisor" => "Supervisor",
        "technician" => "Technician",
        "viewer" => "Viewer",
        _ => "Technician"
    };

    public static UserDto ToDto(this AppUser u) => new(
        u.Id,
        u.UserName ?? "",
        u.FullName,
        u.PersonnelCode,
        u.Mobile,
        RoleToApi(u.Role),
        u.IsActive,
        u.CreatedAt,
        u.SectionAccess().ToArray());

    public static EquipmentGroupDto ToDto(this EquipmentGroup g, int equipmentCount = 0) => new(
        g.Id, g.Name, g.Description, g.Color, g.Theme, g.IsActive, g.CreatedAt, equipmentCount);

    public static EquipmentDto ToDto(this Equipment e) => new(
        e.Id, e.Code, e.Name, e.Type, e.GroupId, e.Group?.Name, e.Group?.Color,
        e.Location, e.IsActive, e.QrCode, e.ImageUrl, e.CommissioningDate, e.CreatedAt);

    public static CheckItemDto ToDto(this CheckItem i) => new(
        i.Id, i.Title, i.Type, i.Unit, i.MinValue, i.MaxValue, i.IsRequired, i.IsActive,
        i.SectionType, i.SortOrder, i.Groups.Select(g => g.EquipmentGroupId).ToArray());

    public static InspectionResultDto ToDto(this InspectionResult r) => new(
        r.Id, r.CheckItemId, r.CheckItem?.Title, r.Status, r.Value, r.TextValue, r.Comment,
        r.TechnicianId, r.Timestamp);

    public static InspectionDto ToDto(this DailyInspection i) => new(
        i.Id, i.EquipmentId, i.Equipment?.Name, i.Equipment?.Code, i.TechnicianId,
        i.Technician?.FullName, i.ShiftId, i.Date, i.Status, i.CreatedAt, i.UpdatedAt,
        i.Results.OrderBy(r => r.CheckItem != null ? r.CheckItem.SortOrder : 0)
            .Select(r => r.ToDto()).ToArray());
}
