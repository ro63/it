using System.ComponentModel.DataAnnotations;

namespace Nipco.Maintenance.Api.Dtos;

// ---------------------------------------------------------------- auth
public sealed record LoginRequest([Required] string Username, [Required] string Password);
public sealed record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);

public sealed record UserDto(
    string Id, string Username, string FullName, string PersonnelCode, string? Mobile,
    string Role, bool IsActive, DateTime CreatedAt, string[] SectionAccess);

public sealed record CreateUserRequest(
    [Required] string Username, [Required] string FullName, string? PersonnelCode, string? Mobile,
    [Required(AllowEmptyStrings = false)] string Password, string Role, string[]? SectionAccess);

public sealed record UpdateUserRequest(
    string FullName, string? PersonnelCode, string? Mobile, string? Role,
    bool? IsActive, string[]? SectionAccess, string? Password);

public sealed record ChangePasswordRequest([Required] string CurrentPassword, [Required] string NewPassword);

// ------------------------------------------------------------- groups
public sealed record EquipmentGroupDto(
    Guid Id, string Name, string? Description, string Color, string Theme,
    bool IsActive, DateTime CreatedAt, int EquipmentCount);

public sealed record SaveEquipmentGroupRequest(
    [Required] string Name, string? Description, string? Color, string? Theme, bool? IsActive);

// ----------------------------------------------------------- equipment
public sealed record EquipmentDto(
    Guid Id, string Code, string Name, string Type, Guid GroupId, string? GroupName,
    string? GroupColor, string Location, bool IsActive, string QrCode, string? ImageUrl,
    DateTime? CommissioningDate, DateTime CreatedAt);

public sealed record SaveEquipmentRequest(
    [Required] string Code, [Required] string Name, string? Type, Guid GroupId,
    string? Location, bool? IsActive, string? QrCode, string? ImageUrl, DateTime? CommissioningDate);

// ----------------------------------------------------------- checklist
public sealed record CheckItemDto(
    Guid Id, string Title, string Type, string? Unit, decimal? MinValue, decimal? MaxValue,
    bool IsRequired, bool IsActive, string? SectionType, int Order, Guid[] EquipmentGroupIds);

public sealed record SaveCheckItemRequest(
    [Required] string Title, string? Type, string? Unit, decimal? MinValue, decimal? MaxValue,
    bool? IsRequired, bool? IsActive, string? SectionType, int? Order, Guid[]? EquipmentGroupIds);

// ---------------------------------------------------------- inspections
public sealed record InspectionResultInput(
    Guid CheckItemId, string Status, decimal? Value, string? TextValue, string? Comment);

public sealed record CreateInspectionRequest(
    Guid EquipmentId, string ShiftId, DateOnly? Date, string? Status,
    List<InspectionResultInput> Results);

public sealed record InspectionResultDto(
    Guid Id, Guid CheckItemId, string? CheckItemTitle, string Status, decimal? Value,
    string? TextValue, string? Comment, string TechnicianId, DateTime Timestamp);

public sealed record InspectionDto(
    Guid Id, Guid EquipmentId, string? EquipmentName, string? EquipmentCode, string TechnicianId,
    string? TechnicianName, string ShiftId, DateOnly Date, string Status,
    DateTime CreatedAt, DateTime UpdatedAt, InspectionResultDto[] Results);

// -------------------------------------------------------------- reports
public sealed record DashboardDto(
    int ActiveEquipment, int TodayInspections, int NokCount, int NeedsReviewCount,
    int OkCount, int TotalInspections, GroupStatDto[] Groups, InspectionDto[] RecentInspections);

public sealed record GroupStatDto(Guid Id, string Name, string Color, int EquipmentCount);

public sealed record PagedResult<T>(int Total, int Page, int PageSize, T[] Items);
