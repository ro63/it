/* =====================================================================
   NIPCO - Database verification / smoke test
   Run after 01_Install_NIPCO_Maintenance.sql:
       sqlcmd -S .\SQLEXPRESS -E -i verify-database.sql
   Every row printed by the first result set should say OK.
   ===================================================================== */
USE [NIPCO_Maintenance];
GO
SET NOCOUNT ON;

PRINT '--- objects ---';
SELECT 'Tables' AS Item, COUNT(*) AS Found, 15 AS Expected FROM sys.tables
UNION ALL SELECT 'Equipment groups', COUNT(*), 5 FROM dbo.EquipmentGroups
UNION ALL SELECT 'Equipment', COUNT(*), 22 FROM dbo.Equipment
UNION ALL SELECT 'Checklist items', COUNT(*), 28 FROM dbo.CheckItems
UNION ALL SELECT 'Checklist mappings', COUNT(*), 28 FROM dbo.CheckItemGroups
UNION ALL SELECT 'Users', COUNT(*), 3 FROM dbo.AspNetUsers
UNION ALL SELECT 'Roles', COUNT(*), 4 FROM dbo.AspNetRoles;
GO

PRINT '--- referential integrity ---';
SELECT
    (SELECT COUNT(*) FROM dbo.Equipment e
        LEFT JOIN dbo.EquipmentGroups g ON g.Id = e.GroupId WHERE g.Id IS NULL) AS EquipmentWithoutGroup,
    (SELECT COUNT(*) FROM dbo.CheckItemGroups c
        LEFT JOIN dbo.CheckItems i ON i.Id = c.CheckItemId WHERE i.Id IS NULL) AS MappingWithoutItem,
    (SELECT COUNT(*) FROM dbo.CheckItemGroups c
        LEFT JOIN dbo.EquipmentGroups g ON g.Id = c.EquipmentGroupId WHERE g.Id IS NULL) AS MappingWithoutGroup;
GO

PRINT '--- users ---';
SELECT UserName, FullName, PersonnelCode, Role, IsActive,
       CASE WHEN PasswordHash IS NULL THEN 'no-hash (API will set default)' ELSE 'hash set' END AS Password
FROM dbo.AspNetUsers ORDER BY UserName;
GO

PRINT '--- checklist per equipment group ---';
SELECT g.Name AS EquipmentGroup, COUNT(ci.CheckItemId) AS Items
FROM dbo.EquipmentGroups g
LEFT JOIN dbo.CheckItemGroups ci ON ci.EquipmentGroupId = g.Id
GROUP BY g.Name ORDER BY g.Name;
GO
