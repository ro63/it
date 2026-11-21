/* =====================================================================
   NIPCO - Daily Equipment Control System
   SQL Server installation script  (idempotent / قابل اجرا چند باره)
   ---------------------------------------------------------------------
   Database : NIPCO_Maintenance
   Run with : sqlcmd -S .\SQLEXPRESS -E -i 01_Install_NIPCO_Maintenance.sql
   ===================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ---------- 1) Create database if missing ---------------------------- */
IF DB_ID(N'NIPCO_Maintenance') IS NULL
BEGIN
    PRINT 'Creating database NIPCO_Maintenance ...';
    CREATE DATABASE [NIPCO_Maintenance] COLLATE Persian_100_CI_AS;
END
ELSE
    PRINT 'Database NIPCO_Maintenance already exists.';
GO

IF DB_ID(N'NIPCO_Maintenance') IS NULL
    THROW 50000, 'Database creation failed. The login needs dbcreator (or CREATE DATABASE) permission.', 1;
GO

USE [NIPCO_Maintenance];
GO

/* ---------- 2) Controlled creation in a transaction ------------------ */
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.SchemaHistory', N'U') IS NULL
    CREATE TABLE dbo.SchemaHistory
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SchemaHistory PRIMARY KEY,
        ScriptName  NVARCHAR(200) NOT NULL,
        AppliedAt   DATETIME2(0) NOT NULL CONSTRAINT DF_SchemaHistory_AppliedAt DEFAULT SYSUTCDATETIME()
    );

/* ---------- 3) Identity tables --------------------------------------- */
IF OBJECT_ID(N'dbo.AspNetRoles', N'U') IS NULL
    CREATE TABLE dbo.AspNetRoles
    (
        Id                   NVARCHAR(450) NOT NULL,
        Name                 NVARCHAR(256) NULL,
        NormalizedName       NVARCHAR(256) NULL,
        ConcurrencyStamp     NVARCHAR(MAX) NULL,
        CONSTRAINT PK_AspNetRoles PRIMARY KEY (Id)
    );

IF OBJECT_ID(N'dbo.AspNetUsers', N'U') IS NULL
    CREATE TABLE dbo.AspNetUsers
    (
        Id                   NVARCHAR(450) NOT NULL,
        UserName             NVARCHAR(256) NULL,
        NormalizedUserName   NVARCHAR(256) NULL,
        Email                NVARCHAR(256) NULL,
        NormalizedEmail      NVARCHAR(256) NULL,
        EmailConfirmed       BIT NOT NULL,
        PasswordHash         NVARCHAR(MAX) NULL,
        SecurityStamp        NVARCHAR(MAX) NULL,
        ConcurrencyStamp     NVARCHAR(MAX) NULL,
        PhoneNumber          NVARCHAR(256) NULL,
        PhoneNumberConfirmed BIT NOT NULL,
        TwoFactorEnabled     BIT NOT NULL,
        LockoutEnd           DATETIMEOFFSET NULL,
        LockoutEnabled       BIT NOT NULL,
        AccessFailedCount    INT NOT NULL,
        FullName             NVARCHAR(150) NOT NULL CONSTRAINT DF_AspNetUsers_FullName DEFAULT N'',
        PersonnelCode        NVARCHAR(20)  NOT NULL CONSTRAINT DF_AspNetUsers_PersonnelCode DEFAULT N'',
        Mobile               NVARCHAR(20)  NULL,
        Role                 NVARCHAR(20)  NOT NULL CONSTRAINT DF_AspNetUsers_Role DEFAULT N'Technician',
        SectionAccessJson    NVARCHAR(400) NULL,
        IsActive             BIT NOT NULL CONSTRAINT DF_AspNetUsers_IsActive DEFAULT 1,
        CreatedAt            DATETIME2 NOT NULL CONSTRAINT DF_AspNetUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AspNetUsers PRIMARY KEY (Id)
    );

IF OBJECT_ID(N'dbo.AspNetRoleClaims', N'U') IS NULL
    CREATE TABLE dbo.AspNetRoleClaims
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AspNetRoleClaims PRIMARY KEY,
        RoleId      NVARCHAR(450) NOT NULL,
        ClaimType   NVARCHAR(MAX) NULL,
        ClaimValue  NVARCHAR(MAX) NULL,
        CONSTRAINT FK_AspNetRoleClaims_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES dbo.AspNetRoles (Id) ON DELETE CASCADE
    );

IF OBJECT_ID(N'dbo.AspNetUserClaims', N'U') IS NULL
    CREATE TABLE dbo.AspNetUserClaims
    (
        Id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AspNetUserClaims PRIMARY KEY,
        UserId     NVARCHAR(450) NOT NULL,
        ClaimType  NVARCHAR(MAX) NULL,
        ClaimValue NVARCHAR(MAX) NULL,
        CONSTRAINT FK_AspNetUserClaims_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE
    );

IF OBJECT_ID(N'dbo.AspNetUserLogins', N'U') IS NULL
    CREATE TABLE dbo.AspNetUserLogins
    (
        LoginProvider       NVARCHAR(128) NOT NULL,
        ProviderKey         NVARCHAR(128) NOT NULL,
        ProviderDisplayName NVARCHAR(MAX) NULL,
        UserId              NVARCHAR(450) NOT NULL,
        CONSTRAINT PK_AspNetUserLogins PRIMARY KEY (LoginProvider, ProviderKey),
        CONSTRAINT FK_AspNetUserLogins_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE
    );

IF OBJECT_ID(N'dbo.AspNetUserTokens', N'U') IS NULL
    CREATE TABLE dbo.AspNetUserTokens
    (
        UserId        NVARCHAR(450) NOT NULL,
        LoginProvider NVARCHAR(128) NOT NULL,
        Name          NVARCHAR(128) NOT NULL,
        Value         NVARCHAR(MAX) NULL,
        CONSTRAINT PK_AspNetUserTokens PRIMARY KEY (UserId, LoginProvider, Name),
        CONSTRAINT FK_AspNetUserTokens_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE
    );

IF OBJECT_ID(N'dbo.AspNetUserRoles', N'U') IS NULL
    CREATE TABLE dbo.AspNetUserRoles
    (
        UserId NVARCHAR(450) NOT NULL,
        RoleId NVARCHAR(450) NOT NULL,
        CONSTRAINT PK_AspNetUserRoles PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_AspNetUserRoles_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE,
        CONSTRAINT FK_AspNetUserRoles_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES dbo.AspNetRoles (Id) ON DELETE CASCADE
    );

/* ---------- 4) Domain tables ----------------------------------------- */
IF OBJECT_ID(N'dbo.EquipmentGroups', N'U') IS NULL
    CREATE TABLE dbo.EquipmentGroups
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EquipmentGroups PRIMARY KEY,
        Name        NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Color       NVARCHAR(20)  NOT NULL CONSTRAINT DF_EquipmentGroups_Color DEFAULT N'#2563eb',
        Theme       NVARCHAR(20)  NOT NULL CONSTRAINT DF_EquipmentGroups_Theme DEFAULT N'default',
        IsActive    BIT NOT NULL CONSTRAINT DF_EquipmentGroups_IsActive DEFAULT 1,
        CreatedAt   DATETIME2 NOT NULL CONSTRAINT DF_EquipmentGroups_CreatedAt DEFAULT SYSUTCDATETIME()
    );

IF OBJECT_ID(N'dbo.Equipment', N'U') IS NULL
    CREATE TABLE dbo.Equipment
    (
        Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Equipment PRIMARY KEY,
        Code              NVARCHAR(50)  NOT NULL,
        Name              NVARCHAR(150) NOT NULL,
        Type              NVARCHAR(30)  NOT NULL CONSTRAINT DF_Equipment_Type DEFAULT N'custom',
        GroupId           UNIQUEIDENTIFIER NOT NULL,
        Location          NVARCHAR(150) NOT NULL CONSTRAINT DF_Equipment_Location DEFAULT N'',
        IsActive          BIT NOT NULL CONSTRAINT DF_Equipment_IsActive DEFAULT 1,
        QrCode            NVARCHAR(50)  NOT NULL,
        ImageUrl          NVARCHAR(500) NULL,
        CommissioningDate DATE NULL,
        CreatedAt         DATETIME2 NOT NULL CONSTRAINT DF_Equipment_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Equipment_EquipmentGroups_GroupId FOREIGN KEY (GroupId) REFERENCES dbo.EquipmentGroups (Id)
    );

IF OBJECT_ID(N'dbo.CheckItems', N'U') IS NULL
    CREATE TABLE dbo.CheckItems
    (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CheckItems PRIMARY KEY,
        Title       NVARCHAR(200) NOT NULL,
        Type        NVARCHAR(20)  NOT NULL CONSTRAINT DF_CheckItems_Type DEFAULT N'boolean',
        Unit        NVARCHAR(20)  NULL,
        MinValue    DECIMAL(10,2) NULL,
        MaxValue    DECIMAL(10,2) NULL,
        IsRequired  BIT NOT NULL CONSTRAINT DF_CheckItems_IsRequired DEFAULT 1,
        IsActive    BIT NOT NULL CONSTRAINT DF_CheckItems_IsActive DEFAULT 1,
        SectionType NVARCHAR(30)  NULL,
        SortOrder   INT NOT NULL CONSTRAINT DF_CheckItems_SortOrder DEFAULT 0
    );

IF OBJECT_ID(N'dbo.CheckItemGroups', N'U') IS NULL
    CREATE TABLE dbo.CheckItemGroups
    (
        CheckItemId      UNIQUEIDENTIFIER NOT NULL,
        EquipmentGroupId UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_CheckItemGroups PRIMARY KEY (CheckItemId, EquipmentGroupId),
        CONSTRAINT FK_CheckItemGroups_CheckItems_CheckItemId FOREIGN KEY (CheckItemId) REFERENCES dbo.CheckItems (Id) ON DELETE CASCADE,
        CONSTRAINT FK_CheckItemGroups_EquipmentGroups_EquipmentGroupId FOREIGN KEY (EquipmentGroupId) REFERENCES dbo.EquipmentGroups (Id)
    );

IF OBJECT_ID(N'dbo.DailyInspections', N'U') IS NULL
    CREATE TABLE dbo.DailyInspections
    (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_DailyInspections PRIMARY KEY,
        EquipmentId  UNIQUEIDENTIFIER NOT NULL,
        TechnicianId NVARCHAR(450) NOT NULL,
        ShiftId      NVARCHAR(20)  NOT NULL CONSTRAINT DF_DailyInspections_ShiftId DEFAULT N'shift1',
        [Date]       DATE NOT NULL,
        Status       NVARCHAR(20)  NOT NULL CONSTRAINT DF_DailyInspections_Status DEFAULT N'completed',
        CreatedAt    DATETIME2 NOT NULL CONSTRAINT DF_DailyInspections_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2 NOT NULL CONSTRAINT DF_DailyInspections_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_DailyInspections_Equipment_EquipmentId FOREIGN KEY (EquipmentId) REFERENCES dbo.Equipment (Id),
        CONSTRAINT FK_DailyInspections_AspNetUsers_TechnicianId FOREIGN KEY (TechnicianId) REFERENCES dbo.AspNetUsers (Id)
    );

IF OBJECT_ID(N'dbo.InspectionResults', N'U') IS NULL
    CREATE TABLE dbo.InspectionResults
    (
        Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_InspectionResults PRIMARY KEY,
        DailyInspectionId UNIQUEIDENTIFIER NOT NULL,
        CheckItemId       UNIQUEIDENTIFIER NOT NULL,
        Status            NVARCHAR(20)  NOT NULL CONSTRAINT DF_InspectionResults_Status DEFAULT N'needs_review',
        Value             DECIMAL(10,2) NULL,
        TextValue         NVARCHAR(500) NULL,
        Comment           NVARCHAR(1000) NULL,
        TechnicianId      NVARCHAR(450) NOT NULL CONSTRAINT DF_InspectionResults_TechnicianId DEFAULT N'',
        [Timestamp]       DATETIME2 NOT NULL CONSTRAINT DF_InspectionResults_Timestamp DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_InspectionResults_DailyInspections_DailyInspectionId FOREIGN KEY (DailyInspectionId) REFERENCES dbo.DailyInspections (Id) ON DELETE CASCADE,
        CONSTRAINT FK_InspectionResults_CheckItems_CheckItemId FOREIGN KEY (CheckItemId) REFERENCES dbo.CheckItems (Id)
    );

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
    CREATE TABLE dbo.AuditLogs
    (
        Id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY,
        ActorId    NVARCHAR(450) NULL,
        [Action]   NVARCHAR(100) NOT NULL,
        EntityName NVARCHAR(100) NOT NULL,
        EntityId   NVARCHAR(100) NOT NULL,
        Details    NVARCHAR(2000) NULL,
        CreatedAt  DATETIME2 NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME()
    );

COMMIT TRANSACTION;
GO

/* ---------- 5) Indexes ----------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'RoleNameIndex' AND object_id = OBJECT_ID(N'dbo.AspNetRoles'))
    CREATE UNIQUE INDEX RoleNameIndex ON dbo.AspNetRoles (NormalizedName) WHERE NormalizedName IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UserNameIndex' AND object_id = OBJECT_ID(N'dbo.AspNetUsers'))
    CREATE UNIQUE INDEX UserNameIndex ON dbo.AspNetUsers (NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'EmailIndex' AND object_id = OBJECT_ID(N'dbo.AspNetUsers'))
    CREATE INDEX EmailIndex ON dbo.AspNetUsers (NormalizedEmail);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetRoleClaims_RoleId')
    CREATE INDEX IX_AspNetRoleClaims_RoleId ON dbo.AspNetRoleClaims (RoleId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUserClaims_UserId')
    CREATE INDEX IX_AspNetUserClaims_UserId ON dbo.AspNetUserClaims (UserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUserLogins_UserId')
    CREATE INDEX IX_AspNetUserLogins_UserId ON dbo.AspNetUserLogins (UserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUserRoles_RoleId')
    CREATE INDEX IX_AspNetUserRoles_RoleId ON dbo.AspNetUserRoles (RoleId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EquipmentGroups_Name')
    CREATE UNIQUE INDEX IX_EquipmentGroups_Name ON dbo.EquipmentGroups (Name);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Equipment_Code')
    CREATE UNIQUE INDEX IX_Equipment_Code ON dbo.Equipment (Code);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Equipment_QrCode')
    CREATE UNIQUE INDEX IX_Equipment_QrCode ON dbo.Equipment (QrCode);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Equipment_GroupId')
    CREATE INDEX IX_Equipment_GroupId ON dbo.Equipment (GroupId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CheckItemGroups_EquipmentGroupId')
    CREATE INDEX IX_CheckItemGroups_EquipmentGroupId ON dbo.CheckItemGroups (EquipmentGroupId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DailyInspections_EquipmentId_Date_ShiftId')
    CREATE INDEX IX_DailyInspections_EquipmentId_Date_ShiftId ON dbo.DailyInspections (EquipmentId, [Date], ShiftId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DailyInspections_TechnicianId')
    CREATE INDEX IX_DailyInspections_TechnicianId ON dbo.DailyInspections (TechnicianId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DailyInspections_Date')
    CREATE INDEX IX_DailyInspections_Date ON dbo.DailyInspections ([Date] DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_InspectionResults_DailyInspectionId')
    CREATE INDEX IX_InspectionResults_DailyInspectionId ON dbo.InspectionResults (DailyInspectionId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_InspectionResults_CheckItemId')
    CREATE INDEX IX_InspectionResults_CheckItemId ON dbo.InspectionResults (CheckItemId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_CreatedAt')
    CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs (CreatedAt DESC);
GO

/* ---------- 6) Seed data (only when empty) --------------------------- */
BEGIN TRANSACTION;

/* Roles */
IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles)
BEGIN
    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES
        (N'11111111-1111-1111-1111-111111111101', N'Admin', N'ADMIN', NEWID()),
        (N'11111111-1111-1111-1111-111111111102', N'Supervisor', N'SUPERVISOR', NEWID()),
        (N'11111111-1111-1111-1111-111111111103', N'Technician', N'TECHNICIAN', NEWID()),
        (N'11111111-1111-1111-1111-111111111104', N'Viewer', N'VIEWER', NEWID());

END

/* Users - password for every seed account: 123456 */
IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUsers)
BEGIN
    INSERT INTO dbo.AspNetUsers
        (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
         PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
         TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount,
         FullName, PersonnelCode, Mobile, Role, SectionAccessJson, IsActive, CreatedAt)
    VALUES
        (N'D926AB37-2A67-57B2-A0DA-4BC98342390E', N'takhti', N'TAKHTI', NULL, NULL, 0,
         N'AQAAAAIAAYagAAAAEE5JUENPLVNBTFQtMjAyNCH7o0ElidbYfM2ql/Q0lvT4oBskvmN5jpkFZCV5SQr4Jg==', NEWID(), NEWID(), N'09121111111', 0,
         0, NULL, 1, 0,
         N'جعفر تختی', N'1001', N'09121111111', N'Admin', NULL, 1, SYSUTCDATETIME()),
        (N'B7766C29-EEB2-5347-B9C5-DCF5A7139BC3', N'esfandiari', N'ESFANDIARI', NULL, NULL, 0,
         N'AQAAAAIAAYagAAAAEE5JUENPLVNBTFQtMjAyNCH7o0ElidbYfM2ql/Q0lvT4oBskvmN5jpkFZCV5SQr4Jg==', NEWID(), NEWID(), N'09122222222', 0,
         0, NULL, 1, 0,
         N'اسفندیاری', N'1002', N'09122222222', N'Supervisor', NULL, 1, SYSUTCDATETIME()),
        (N'B2BDD8ED-636D-5266-AA0C-483F5DF06F91', N'azmian', N'AZMIAN', NULL, NULL, 0,
         N'AQAAAAIAAYagAAAAEE5JUENPLVNBTFQtMjAyNCH7o0ElidbYfM2ql/Q0lvT4oBskvmN5jpkFZCV5SQr4Jg==', NEWID(), NEWID(), N'09123333333', 0,
         0, NULL, 1, 0,
         N'فردین عظمیان', N'1003', N'09123333333', N'Technician', N'["mechanical"]', 1, SYSUTCDATETIME());

END

IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles)
BEGIN
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) SELECT N'D926AB37-2A67-57B2-A0DA-4BC98342390E', N'11111111-1111-1111-1111-111111111101' WHERE NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = N'D926AB37-2A67-57B2-A0DA-4BC98342390E' AND RoleId = N'11111111-1111-1111-1111-111111111101');
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) SELECT N'B7766C29-EEB2-5347-B9C5-DCF5A7139BC3', N'11111111-1111-1111-1111-111111111102' WHERE NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = N'B7766C29-EEB2-5347-B9C5-DCF5A7139BC3' AND RoleId = N'11111111-1111-1111-1111-111111111102');
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) SELECT N'B2BDD8ED-636D-5266-AA0C-483F5DF06F91', N'11111111-1111-1111-1111-111111111103' WHERE NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = N'B2BDD8ED-636D-5266-AA0C-483F5DF06F91' AND RoleId = N'11111111-1111-1111-1111-111111111103');
END

/* Equipment groups */
IF NOT EXISTS (SELECT 1 FROM dbo.EquipmentGroups)
BEGIN
    INSERT INTO dbo.EquipmentGroups (Id, Name, Description, Color, Theme, IsActive, CreatedAt) VALUES
        (N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'پرس‌ها', N'پرس‌های هیدرولیک', N'#3b82f6', N'blue', 1, SYSUTCDATETIME()),
        (N'43DB7061-72D8-560F-876B-7A1A65408A37', N'ربات‌ها', N'ربات‌های ABB', N'#16a34a', N'green', 1, SYSUTCDATETIME()),
        (N'6E1EEF76-393E-509E-93C0-D832DE467193', N'کمپرسورها', N'کمپرسورهای اسکرو', N'#ea580c', N'orange', 1, SYSUTCDATETIME()),
        (N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'لیفتراک‌ها', N'لیفتراک‌های سپاهان', N'#9333ea', N'purple', 1, SYSUTCDATETIME()),
        (N'12A23857-79F5-5712-B11F-45FE24A904E4', N'موتورخانه', N'تجهیزات موتورخانه', N'#dc2626', N'red', 1, SYSUTCDATETIME());
END

/* Equipment (22 items) */
IF NOT EXISTS (SELECT 1 FROM dbo.Equipment)
BEGIN
    INSERT INTO dbo.Equipment (Id, Code, Name, Type, GroupId, Location, IsActive, QrCode, CommissioningDate, CreatedAt) VALUES
        (N'2F879EA3-B8AF-5548-9D22-23B9008D18DC', N'PRS-1000', N'پرس هیدرولیک 1000 تن', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 1', 1, N'PRS-1000', '2020-01-01', SYSUTCDATETIME()),
        (N'2ED99188-E6E9-50D7-9DFB-C8053DCB0456', N'PRS-1200', N'پرس هیدرولیک 1200 تن', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 1', 1, N'PRS-1200', '2020-01-01', SYSUTCDATETIME()),
        (N'2BCB3C70-BC88-58C2-A4FB-B0A07AE5379C', N'PRS-1500', N'پرس هیدرولیک 1500 تن', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 2', 1, N'PRS-1500', '2020-01-01', SYSUTCDATETIME()),
        (N'6FF2CA02-1011-5CC0-9493-3544CC645E3F', N'PRS-2000', N'پرس هیدرولیک 2000 تن', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 2', 1, N'PRS-2000', '2020-01-01', SYSUTCDATETIME()),
        (N'599F622E-A93F-5D10-87B0-959B488355CD', N'PRS-1200-A', N'پرس هیدرولیک 1200 تن عابدی', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 3', 1, N'PRS-1200-A', '2020-01-01', SYSUTCDATETIME()),
        (N'75E45D66-A357-579E-A40D-3CA12A5004D8', N'PRS-006', N'پرس شماره 6', N'press', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3', N'سالن تولید 3', 1, N'PRS-006', '2020-01-01', SYSUTCDATETIME()),
        (N'3E353649-B392-50AC-A7F8-9CCBC42A94D1', N'ABB-01', N'ربات ABB-01', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-01', '2021-01-01', SYSUTCDATETIME()),
        (N'ABB7002E-D335-59CD-AB5F-F36764C357BD', N'ABB-02', N'ربات ABB-02', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-02', '2021-01-01', SYSUTCDATETIME()),
        (N'8E922D87-3CA5-5C99-ABFA-54552F682483', N'ABB-03', N'ربات ABB-03', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-03', '2021-01-01', SYSUTCDATETIME()),
        (N'9B91FD58-6265-5438-A022-50828A2A9B96', N'ABB-04', N'ربات ABB-04', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-04', '2021-01-01', SYSUTCDATETIME()),
        (N'92D5A0E0-855B-5F45-946C-0001D8E4CEC3', N'ABB-05', N'ربات ABB-05', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-05', '2021-01-01', SYSUTCDATETIME()),
        (N'BD25F0DF-3232-5E73-8C6F-2D62FD345D68', N'ABB-06', N'ربات ABB-06', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-06', '2021-01-01', SYSUTCDATETIME()),
        (N'267341C7-7312-5099-8DF4-2FDB88FF049B', N'ABB-07', N'ربات ABB-07', N'robot', N'43DB7061-72D8-560F-876B-7A1A65408A37', N'خط مونتاژ', 1, N'ABB-07', '2021-01-01', SYSUTCDATETIME()),
        (N'D7C6D75A-DB72-50B0-BD12-44205BC1A6CF', N'CMP-01', N'کمپرسور 01', N'compressor', N'6E1EEF76-393E-509E-93C0-D832DE467193', N'اتاق کمپرسور', 1, N'CMP-01', '2019-01-01', SYSUTCDATETIME()),
        (N'8E86ABF0-66C2-561D-A02D-DE967DAE5E9D', N'CMP-02', N'کمپرسور 02', N'compressor', N'6E1EEF76-393E-509E-93C0-D832DE467193', N'اتاق کمپرسور', 1, N'CMP-02', '2019-01-01', SYSUTCDATETIME()),
        (N'1CFEA956-0EBF-55F8-B608-D991F936A3D9', N'CMP-03', N'کمپرسور 03', N'compressor', N'6E1EEF76-393E-509E-93C0-D832DE467193', N'اتاق کمپرسور', 1, N'CMP-03', '2019-01-01', SYSUTCDATETIME()),
        (N'FB1C43D9-CC85-5D7D-82DF-3051B09F2889', N'CMP-04', N'کمپرسور 04', N'compressor', N'6E1EEF76-393E-509E-93C0-D832DE467193', N'اتاق کمپرسور', 1, N'CMP-04', '2019-01-01', SYSUTCDATETIME()),
        (N'C588F30E-B131-524B-B1EA-DD3505ECE60A', N'FLK-01', N'لیفتراک 01', N'forklift', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'انبار', 1, N'FLK-01', '2018-01-01', SYSUTCDATETIME()),
        (N'CABD0B0C-7196-5DD1-B82F-8D6ABED399C2', N'FLK-02', N'لیفتراک 02', N'forklift', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'انبار', 1, N'FLK-02', '2018-01-01', SYSUTCDATETIME()),
        (N'EEA9CB0E-2459-5BA1-9B5C-1F916D11598F', N'FLK-03', N'لیفتراک 03', N'forklift', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'انبار', 1, N'FLK-03', '2018-01-01', SYSUTCDATETIME()),
        (N'4C4B2402-87AB-5AD0-BC95-4266A1B3D3DE', N'FLK-04', N'لیفتراک 04', N'forklift', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'انبار', 1, N'FLK-04', '2018-01-01', SYSUTCDATETIME()),
        (N'FAA39ED3-9455-5339-A160-D06AD66D2C8F', N'FLK-05', N'لیفتراک 05', N'forklift', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0', N'انبار', 1, N'FLK-05', '2018-01-01', SYSUTCDATETIME());
END

/* Checklist items (28 items) */
IF NOT EXISTS (SELECT 1 FROM dbo.CheckItems)
BEGIN
    INSERT INTO dbo.CheckItems (Id, Title, Type, Unit, MinValue, MaxValue, IsRequired, IsActive, SectionType, SortOrder) VALUES
        (N'7536E756-DF1A-5AF7-A3FC-2D999B63182D', N'بررسی سطح روغن', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 1),
        (N'EF5DC227-56E8-5DA4-9262-46BE908056A9', N'بررسی نشتی روغن', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 2),
        (N'49FAEECD-C9C7-585F-A149-C14E594F5E19', N'بررسی فشار سیستم', N'numeric', N'bar', 0.0, 300.0, 1, 1, N'mechanical', 3),
        (N'6EE8B0DE-9738-56EF-BDEF-69B0312136DC', N'بررسی دمای روغن', N'numeric', N'°C', 0.0, 100.0, 1, 1, N'mechanical', 4),
        (N'48B06B32-CAD9-5F12-A338-BA8439C827E7', N'بررسی صدای غیرعادی', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 5),
        (N'5A5EA42A-1A33-5D23-B6D6-EAF85EB4DB99', N'بررسی سنسورها', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 6),
        (N'2F5721B9-6556-511D-A28D-6E37B02FF809', N'بررسی وضعیت ایمنی', N'boolean', NULL, NULL, NULL, 1, 1, N'safety', 7),
        (N'E8C5FC61-BE04-5142-9421-2D1EBB705286', N'بررسی آلارم', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 1),
        (N'6F3EBB8A-1DC7-5595-93B1-3B5D106CE39D', N'بررسی کابل‌ها', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 2),
        (N'6EC3B3D6-1207-5E4D-A936-B64906024C7B', N'بررسی گریس کاری', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 3),
        (N'1D2E73A5-CA04-5768-8098-A746A30A0549', N'بررسی وضعیت سروو', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 4),
        (N'7FE88781-DDFE-51DE-A8A1-D27FF7CC9F29', N'بررسی Emergency Stop', N'boolean', NULL, NULL, NULL, 1, 1, N'safety', 5),
        (N'2D352020-AEF1-5B76-A038-9FE1C2885AF1', N'سطح روغن', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 1),
        (N'B1934754-517F-5EE5-B668-CDAEBDFD71E5', N'فشار خروجی', N'numeric', N'bar', 0.0, 13.0, 1, 1, N'mechanical', 2),
        (N'625C0092-6CD8-5090-9C8F-20827C67781C', N'دمای کاری', N'numeric', N'°C', 0.0, 100.0, 1, 1, N'mechanical', 3),
        (N'FBC2AD6C-A4C9-5AF8-82F0-71EF41E1BCF5', N'نشتی هوا', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 4),
        (N'3A40C7E5-93FD-54CD-9466-9300E1B309A4', N'وضعیت فیلترها', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 5),
        (N'9E480BEC-AA24-5AE8-940D-7869799E36AA', N'آب رادیاتور', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 1),
        (N'F6C4682E-91AD-5822-AD38-41B0E4582FDD', N'روغن موتور', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 2),
        (N'FF3E6320-CD76-512A-A59D-EE2A604B7D58', N'روغن هیدرولیک', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 3),
        (N'24E65783-6B39-5E9A-ABCF-F8429B7C8FA3', N'وضعیت لاستیک', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 4),
        (N'BC7C14A3-C7E5-5B27-ADBC-AFF9C01B81AA', N'چراغ‌ها', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 5),
        (N'5B166E5D-4C75-5257-977D-FA7CDC60976E', N'بوق', N'boolean', NULL, NULL, NULL, 1, 1, N'safety', 6),
        (N'AACB4EF5-31CE-5199-80AF-447CCF29902D', N'فشار سیستم', N'numeric', N'bar', 0.0, 10.0, 1, 1, N'mechanical', 1),
        (N'719866AB-0F0E-55FE-ABEA-6CEB81AEBD3E', N'دمای سیستم', N'numeric', N'°C', 0.0, 120.0, 1, 1, N'mechanical', 2),
        (N'F14F3F75-C76B-589C-874B-130365C2902F', N'نشتی', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 3),
        (N'97900B51-367E-5A08-8082-61B9B3D05D0B', N'وضعیت پمپ‌ها', N'boolean', NULL, NULL, NULL, 1, 1, N'mechanical', 4),
        (N'8959F40A-45E5-57F6-8C4E-45B9A260485A', N'وضعیت برق', N'boolean', NULL, NULL, NULL, 1, 1, N'electrical', 5);
END

/* Checklist <-> equipment group mapping */
IF NOT EXISTS (SELECT 1 FROM dbo.CheckItemGroups)
BEGIN
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'7536E756-DF1A-5AF7-A3FC-2D999B63182D', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'EF5DC227-56E8-5DA4-9262-46BE908056A9', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'49FAEECD-C9C7-585F-A149-C14E594F5E19', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'6EE8B0DE-9738-56EF-BDEF-69B0312136DC', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'48B06B32-CAD9-5F12-A338-BA8439C827E7', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'5A5EA42A-1A33-5D23-B6D6-EAF85EB4DB99', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'2F5721B9-6556-511D-A28D-6E37B02FF809', N'C059D7BF-6101-5778-9338-BFA8F53CF0C3');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'E8C5FC61-BE04-5142-9421-2D1EBB705286', N'43DB7061-72D8-560F-876B-7A1A65408A37');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'6F3EBB8A-1DC7-5595-93B1-3B5D106CE39D', N'43DB7061-72D8-560F-876B-7A1A65408A37');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'6EC3B3D6-1207-5E4D-A936-B64906024C7B', N'43DB7061-72D8-560F-876B-7A1A65408A37');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'1D2E73A5-CA04-5768-8098-A746A30A0549', N'43DB7061-72D8-560F-876B-7A1A65408A37');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'7FE88781-DDFE-51DE-A8A1-D27FF7CC9F29', N'43DB7061-72D8-560F-876B-7A1A65408A37');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'2D352020-AEF1-5B76-A038-9FE1C2885AF1', N'6E1EEF76-393E-509E-93C0-D832DE467193');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'B1934754-517F-5EE5-B668-CDAEBDFD71E5', N'6E1EEF76-393E-509E-93C0-D832DE467193');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'625C0092-6CD8-5090-9C8F-20827C67781C', N'6E1EEF76-393E-509E-93C0-D832DE467193');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'FBC2AD6C-A4C9-5AF8-82F0-71EF41E1BCF5', N'6E1EEF76-393E-509E-93C0-D832DE467193');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'3A40C7E5-93FD-54CD-9466-9300E1B309A4', N'6E1EEF76-393E-509E-93C0-D832DE467193');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'9E480BEC-AA24-5AE8-940D-7869799E36AA', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'F6C4682E-91AD-5822-AD38-41B0E4582FDD', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'FF3E6320-CD76-512A-A59D-EE2A604B7D58', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'24E65783-6B39-5E9A-ABCF-F8429B7C8FA3', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'BC7C14A3-C7E5-5B27-ADBC-AFF9C01B81AA', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'5B166E5D-4C75-5257-977D-FA7CDC60976E', N'FAB334E3-C899-55CC-AE36-384C5D0EADC0');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'AACB4EF5-31CE-5199-80AF-447CCF29902D', N'12A23857-79F5-5712-B11F-45FE24A904E4');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'719866AB-0F0E-55FE-ABEA-6CEB81AEBD3E', N'12A23857-79F5-5712-B11F-45FE24A904E4');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'F14F3F75-C76B-589C-874B-130365C2902F', N'12A23857-79F5-5712-B11F-45FE24A904E4');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'97900B51-367E-5A08-8082-61B9B3D05D0B', N'12A23857-79F5-5712-B11F-45FE24A904E4');
    INSERT INTO dbo.CheckItemGroups (CheckItemId, EquipmentGroupId) VALUES (N'8959F40A-45E5-57F6-8C4E-45B9A260485A', N'12A23857-79F5-5712-B11F-45FE24A904E4');
END

/* Record script execution (once) */
IF NOT EXISTS (SELECT 1 FROM dbo.SchemaHistory WHERE ScriptName = N'01_Install_NIPCO_Maintenance.sql')
    INSERT INTO dbo.SchemaHistory (ScriptName) VALUES (N'01_Install_NIPCO_Maintenance.sql');

COMMIT TRANSACTION;
GO

/* ---------- 7) Summary ----------------------------------------------- */
PRINT '---------------------------------------------';
PRINT ' NIPCO_Maintenance installation finished';
PRINT ' Users   : takhti / esfandiari / azmian  (password: 123456)';
PRINT ' Tables  : ' + CAST((SELECT COUNT(*) FROM sys.tables) AS VARCHAR(10));
PRINT ' Equipment rows      : ' + CAST((SELECT COUNT(*) FROM dbo.Equipment) AS VARCHAR(10));
PRINT ' Checklist item rows : ' + CAST((SELECT COUNT(*) FROM dbo.CheckItems) AS VARCHAR(10));
PRINT '---------------------------------------------';
GO
