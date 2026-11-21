# نصب سیستم کنترل روزانه تجهیزات NIPCO

این نسخه همان برنامه قبلی است (ظاهر و صفحات بدون تغییر) با این تفاوت که
داده‌ها به‌جای `localStorage` مرورگر در **SQL Server** ذخیره می‌شوند و یک API
کامل ASP.NET Core در کنار آن قرار گرفته است.

```
nipco-maintenance-sql/
├── db/
│   └── 01_Install_NIPCO_Maintenance.sql   ← اسکریپت نصب دیتابیس (idempotent)
├── server/Nipco.Maintenance.Api/          ← API + میزبانی SPA (net10.0)
├── src/                                   ← React + Vite (بدون تغییر در ظاهر)
├── deploy/                                ← اسکریپت‌های publish / نصب IIS / نصب DB
└── docs/install.md                        ← همین فایل
```

---

## ۱) پیش‌نیازها

| نرم‌افزار | نسخه | توضیح |
|---|---|---|
| SQL Server | 2016 یا بالاتر (Express کافی است) | موتور دیتابیس |
| .NET Runtime / ASP.NET Core Runtime | **10.0** | اجرای API |
| IIS (اختیاری) | 10 | میزبانی روی ویندوز |
| Node.js | 20+ | فقط برای build فرانت‌اند |

> اگر می‌خواهید همه چیز روی یک ماشین باشد: SQL Server + IIS + Hosting Bundle نسخه ۱۰.

---

## ۲) نصب دیتابیس

### روش الف — خط فرمان (پیشنهادی)

```powershell
cd <مسیر برنامه>
powershell -ExecutionPolicy Bypass -File deploy\install-database.ps1 -Server ".\SQLEXPRESS"
```

### روش ب — SSMS / Azure Data Studio

فایل `db/01_Install_NIPCO_Maintenance.sql` را روی سرور مورد نظر اجرا کنید.
اسکریپت خودش دیتابیس `NIPCO_Maintenance` را می‌سازد.

### روش ج — sqlcmd دستی

```powershell
sqlcmd -S .\SQLEXPRESS -E -i db\01_Install_NIPCO_Maintenance.sql
```

اسکریپت **قابل اجرای چندباره** است: اگر دیتابیس وجود داشته باشد فقط جداول/ایندکس‌های
نبود‌شده ساخته می‌شوند و داده‌های اولیه هم فقط وقتی جداول خالی باشند درج می‌شوند.

آنچه ساخته می‌شود:

* ۷ جدول دامنه: `EquipmentGroups`, `Equipment`, `CheckItems`, `CheckItemGroups`,
  `DailyInspections`, `InspectionResults`, `AuditLogs`
* جداول Identity: `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, ...
* ایندکس‌های یکتا (`Equipment.Code`, `Equipment.QrCode`, `EquipmentGroups.Name`) و
  ایندکس‌های گزارش‌گیری (تاریخ بازدید، تجهیز/تاریخ/شیفت)
* داده اولیه: ۵ گروه تجهیزات، ۲۲ تجهیز، ۲۸ آیتم چک‌لیست، ۳ کاربر
  (`takhti`, `esfandiari`, `azmian` با رمز `123456` — مدیر، سرپرست، تکنسین)

---

## ۳) تنظیم اتصال و کلید امنیتی

فایل `appsettings.Production.json` را کنار `Nipco.Maintenance.Api.dll` بسازید
(نمونه: `server/Nipco.Maintenance.Api/appsettings.Production.Sample.json`):

```json
{
  "ConnectionStrings": {
    "Maintenance": "Server=.\\SQLEXPRESS;Database=NIPCO_Maintenance;User Id=nipco_app;Password=***;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  },
  "Jwt": {
    "Issuer": "NIPCO.Maintenance",
    "Audience": "NIPCO.Maintenance.Client",
    "Key": "<یک رشته تصادفی حداقل ۳۲ کاراکتری>",
    "ExpiryHours": 12
  },
  "Cors": { "AllowedOrigins": [ "http://localhost" ] },
  "Bootstrap": {
    "AdminUsername": "",
    "AdminPassword": "",
    "EnsureOnStartup": true
  },
  "AllowedHosts": "*"
}
```

ساخت کلید تصادفی:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

* `Jwt:Key` اجباری است؛ اگر خالی یا کوتاه‌تر از ۳۲ کاراکتر باشد، برنامه بالا نمی‌آید.
* اگر دیتابیس را با `dotnet ef database update` خالی ساخته‌اید، با پر کردن
  `Bootstrap:AdminUsername` / `Bootstrap:AdminPassword` هنگام استارت یک کاربر مدیر ساخته می‌شود.

### کاربر دیتابیس (اختیاری ولی توصیه‌شده)

```sql
USE master;
CREATE LOGIN nipco_app WITH PASSWORD = N'***';
GO
USE NIPCO_Maintenance;
CREATE USER nipco_app FOR LOGIN nipco_app;
ALTER ROLE db_datareader ADD MEMBER nipco_app;
ALTER ROLE db_datawriter ADD MEMBER nipco_app;
GO
```

---

## ۴) ساخت و انتشار برنامه

روی ماشین build (نیاز به Node.js و .NET SDK 10):

```powershell
powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\publish
```

مراحل داخل اسکریپت: `npm ci` → `npm run build` → کپی `dist` در `wwwroot` →
`dotnet publish` → کپی پوشه‌های `db` و `docs` کنار خروجی.

خروجی یک پوشه تک‌سرویسی است: همان پورت هم UI را سرو می‌کند و هم `/api`.
(برای مسیرهای کلاینتی مثل `/dashboard` هم fallback به `index.html` انجام می‌شود.)

### اجرای سریع برای تست

```powershell
cd C:\NIPCO\publish
dotnet Nipco.Maintenance.Api.dll --urls http://0.0.0.0:8080
```

سپس مرورگر: <http://localhost:8080> — ورود با `takhti / 123456`.

---

## ۵) میزبانی روی IIS

```powershell
# PowerShell با دسترسی Administrator
powershell -ExecutionPolicy Bypass -File deploy\iis-setup.ps1 `
    -PhysicalPath C:\inetpub\NIPCO-Maintenance -Port 80
```

۱. خروجی `publish` را در همان مسیر کپی کنید.
۲. `appsettings.Production.json` را کنار dll قرار دهید.
۳. به هویت Application Pool دسترسی زیر بدهید:

```powershell
# دسترسی خواندن/نوشتن به پوشه کلیدهای DataProtection (اگر استفاده می‌کنید)
icacls "C:\ProgramData\NIPCO\Maintenance\Keys" /grant "IIS AppPool\NIPCO-Maintenance-Pool:(OI)(CI)M"
```

۴. اگر از Windows Authentication برای SQL استفاده می‌کنید، همان کاربر App Pool
   (`IIS AppPool\NIPCO-Maintenance-Pool`) را در SQL Server به‌عنوان login بسازید و
   به دیتابیس `NIPCO_Maintenance` دسترسی `db_datareader`/`db_datawriter` بدهید.
   در غیر این صورت از `User Id` / `Password` در connection string استفاده کنید.

---

## ۶) API ها (خلاصه)

| متد | مسیر | دسترسی | کار |
|---|---|---|---|
| POST | `/api/auth/login` | آزاد | ورود، برگرداندن JWT |
| GET | `/api/auth/me` | کاربر وارد‌شده | پروفایل |
| POST | `/api/auth/change-password` | کاربر وارد‌شده | تغییر رمز |
| GET/POST/PUT/DELETE | `/api/users` | Admin/Supervisor | مدیریت کاربران (حذف = غیرفعال‌سازی) |
| GET | `/api/equipment-groups` | کاربر وارد‌شده | گروه‌ها + تعداد تجهیز |
| GET | `/api/equipment-groups/{id}/check-items` | کاربر وارد‌شده | چک‌لیست یک گروه |
| GET/POST/PUT/DELETE | `/api/equipment` | کاربر / Admin+Supervisor | تجهیزات |
| GET | `/api/equipment/by-code/{code}` | کاربر وارد‌شده | اسکن QR |
| GET/POST/PUT/DELETE | `/api/check-items` | کاربر / Admin+Supervisor | آیتم‌های چک‌لیست |
| GET/POST/PUT/DELETE | `/api/inspections` | کاربر / ثبت: همه، ویرایش: Admin+Supervisor | بازدیدهای روزانه |
| GET | `/api/reports/dashboard` | کاربر وارد‌شده | کارت‌های داشبورد |
| GET | `/api/reports/inspection-trend?days=14` | کاربر وارد‌شده | روند بازدید |
| GET | `/api/reports/problem-items?days=30` | کاربر وارد‌شده | پرتکرارترین خرابی‌ها |
| GET | `/api/audit-logs` | Admin/Supervisor | لاگ عملیات |

بررسی سلامت سرویس: `GET /health` (اگر دیتابیس در دسترس نباشد ۵۰۳ برمی‌گرداند — مناسب IIS / مانیتورینگ).

---

## ۷) نکات عملیاتی

* **پشتیبان‌گیری**: به‌صورت دوره‌ای `BACKUP DATABASE NIPCO_Maintenance TO DISK=...`
  یا Maintenance Plan در SSMS.
* **تغییر رمز کاربران پیش‌فرض** بلافاصله بعد از نصب انجام شود
  (صفحه «کاربران» بعد از تکمیل، یا `POST /api/auth/change-password`).
* **تاریخ‌ها** به‌صورت UTC ذخیره می‌شوند؛ نمایش تاریخ در UI مانند قبل است.
* **حذف منطقی**: تجهیز/آیتم چک‌لیست/کاربری که سابقه دارد حذف فیزیکی نمی‌شود،
  فقط `IsActive = 0` می‌شود تا گزارش‌های قبلی سالم بمانند.
* **Migration (اختیاری)**: EF Core migration آماده نیست؛ اسکریپت SQL منبع حقیقت
  اسکیمای دیتابیس است. برای تغییرات بعدی یک فایل `db/02_*.sql` اضافه کنید.
