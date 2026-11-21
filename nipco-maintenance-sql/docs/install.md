# نصب سیستم کنترل روزانه تجهیزات NIPCO

نسخه SQL Server همان برنامه قبلی است؛ **ظاهر، صفحات و تم‌ها تغییر نکرده‌اند**.
تنها تفاوت: داده‌ها به‌جای حافظه مرورگر در **SQL Server** ذخیره می‌شوند.

---

## ۰) پیش‌نیازها

| مورد | نسخه | چرا لازم است |
|---|---|---|
| SQL Server (Express کافی است) | ۲۰۱۶ یا بالاتر | دیتابیس |
| ASP.NET Core Runtime + .NET Runtime | **۱۰.۰** | اجرای API |
| IIS + ASP.NET Core Hosting Bundle | ۱۰ | فقط اگر با IIS میزبانی می‌کنید |
| Node.js | فقط روی ماشین Build | ساخت فایل‌های UI |
| .NET SDK 10 | فقط روی ماشین Build | ساخت خروجی publish |

> اگر همه کارها را روی یک سرور ویندوز انجام می‌دهید، هر دو مورد Node.js و SDK را
> همان‌جا نصب کنید و مستقیم `publish.ps1` را اجرا کنید.

---

## ۱) گرفتن فایل‌های نصب

### الف) ساخت بسته روی ماشین Build (پیشنهادی)

```powershell
cd <مسیر پروژه>\nipco-maintenance-sql
powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\publish
```

این اسکریپت به‌ترتیب:

1. `npm ci` — نصب پکیج‌های فرانت‌اند
2. `npm run build` — ساخت UI (بدون داده نمونه)
3. کپی خروجی در `server\Nipco.Maintenance.Api\wwwroot`
4. `dotnet publish -c Release -r win-x64`
5. کپی پوشه‌های `db` و `docs` و نمونه تنظیمات کنار خروجی

خروجی `C:\NIPCO\publish` **همان بسته نصب** است. کل این پوشه را روی سرور کپی کنید.

### ب) بسته آماده

اگر پوشه `dist-package/` را در اختیار دارید، محتوای آن همان چیزی است که
`publish.ps1` می‌سازد؛ مستقیم روی سرور کپی کنید.

---

## ۲) نصب دیتابیس

روی سرور، با کاربری که اجازه ساخت دیتابیس دارد:

```powershell
cd C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File db\install-database.ps1 -Server ".\SQLEXPRESS"
```

یا با SSMS: فایل `db\01_Install_NIPCO_Maintenance.sql` را باز و اجرا (F5) کنید.

اسکریپت **قابل اجرای چندباره** است و این‌ها را می‌سازد:

* دیتابیس `NIPCO_Maintenance` (collation فارسی)
* جداول: `EquipmentGroups`, `Equipment`, `CheckItems`, `CheckItemGroups`,
  `DailyInspections`, `InspectionResults`, `AuditLogs`
* جداول کاربران/نقش‌ها (ASP.NET Identity)
* ایندکس‌های یکتا و گزارشی
* داده اولیه: ۵ گروه، ۲۲ تجهیز، ۲۸ آیتم چک‌لیست، ۳ کاربر

### بررسی صحت نصب

```powershell
sqlcmd -S .\SQLEXPRESS -E -i db\verify-database.sql
```

باید ۵/۲۲/۲۸/۳ و ۱۸ جدول را نشان دهد و هیچ ردیف «بدون گروه» نداشته باشد.

### کاربر دیتابیس برای برنامه (روش امن‌تر)

```sql
USE master;
CREATE LOGIN nipco_app WITH PASSWORD = N'یک-رمز-قوی';
GO
USE NIPCO_Maintenance;
CREATE USER nipco_app FOR LOGIN nipco_app;
ALTER ROLE db_datareader ADD MEMBER nipco_app;
ALTER ROLE db_datawriter ADD MEMBER nipco_app;
GO
```

---

## ۳) تنظیمات برنامه

فایل تنظیمات را با یک کلید امنیتی تصادفی بسازید:

```powershell
cd C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 `
    -AppPath C:\NIPCO\publish -Server ".\SQLEXPRESS"

# یا با کاربر SQL:
powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 `
    -AppPath C:\NIPCO\publish -Server ".\SQLEXPRESS" `
    -UseSqlLogin -SqlUser nipco_app -SqlPassword 'رمز'
```

فایل `appsettings.Production.json` ساخته می‌شود:

```json
{
  "ConnectionStrings": {
    "Maintenance": "Server=.\\SQLEXPRESS;Database=NIPCO_Maintenance;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  },
  "Jwt": { "Key": "<کلید تصادفی>", "ExpiryHours": 12 },
  "Bootstrap": { "EnsureOnStartup": true, "DefaultUserPassword": "123456" },

  "AllowedHosts": "*"
}
```

نکته‌ها:

* `Jwt:Key` اجباری است (حداقل ۳۲ کاراکتر). اگر خالی باشد برنامه با پیام واضح بالا نمی‌آید.
* رمز کاربران اولیه در SQL ذخیره نمی‌شود؛ در اولین اجرا، API برای کاربران بدون رمز
  رمز پیش‌فرض `Bootstrap:DefaultUserPassword` (پیش‌فرض `123456`) را با الگوریتم
  استاندارد Identity تنظیم می‌کند. بعد از اولین ورود آن را عوض کنید.
* `Cors:AllowedOrigins` را خالی بگذارید؛ UI و API روی یک آدرس هستند.

---

## ۴) اجرا

### الف) تست سریع (کنسول)

```powershell
cd C:\NIPCO\publish
dotnet Nipco.Maintenance.Api.dll --urls http://0.0.0.0:8080
```

مرورگر: `http://localhost:8080` → ورود `takhti` / `123456`

### ب) سرویس ویندوز (بدون IIS)

```powershell
powershell -ExecutionPolicy Bypass -File deploy\install-windows-service.ps1 `
    -AppPath C:\NIPCO\publish -Port 8080
```

یک Task در Startup ساخته می‌شود که برنامه را با کاربر SYSTEM اجرا می‌کند.
اگر می‌خواهید Application Pool کاربر جدا داشته باشد، از IIS استفاده کنید.

> چون Task با کاربر SYSTEM اجرا می‌شود، برای احراز هویت ویندوزی SQL باید
> `NT AUTHORITY\SYSTEM` در SQL Server login داشته باشد؛ در غیر این‌صورت از
> `-UseSqlLogin` استفاده کنید.

### ج) IIS (توصیه‌شده برای محیط عملیاتی)

```powershell
# PowerShell با دسترسی Administrator
powershell -ExecutionPolicy Bypass -File deploy\iis-setup.ps1 `
    -PhysicalPath C:\inetpub\NIPCO-Maintenance -Port 80
```

سپس کافی است خروجی publish را در `C:\inetpub\NIPCO-Maintenance` کپی کنید.
Application Pool باید **No Managed Code** باشد (اسکریپت همین را تنظیم می‌کند).

* اگر SQL با Windows Authentication است، به هویت App Pool دسترسی بدهید:

```sql
CREATE LOGIN [IIS APPPOOL\NIPCO-Maintenance-Pool] FROM WINDOWS;
USE NIPCO_Maintenance;
CREATE USER [IIS APPPOOL\NIPCO-Maintenance-Pool] FOR LOGIN [IIS APPPOOL\NIPCO-Maintenance-Pool];
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\NIPCO-Maintenance-Pool];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\NIPCO-Maintenance-Pool];
GO
```

* پورت ۸۰ را برای کاربران شبکه باز کنید: `New-NetFirewallRule -DisplayName "NIPCO" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow`

---

## ۵) کنترل صحت نصب

```powershell
powershell -ExecutionPolicy Bypass -File deploy\healthcheck.ps1 -Url http://localhost:8080
```

* `/health` → `{"status":"ok","database":"reachable"}` (اگر دیتابیس در دسترس نباشد: ۵۰۳)
* صفحه اصلی باید همان صفحه ورود برنامه باشد.

ورود با سه کاربر اولیه:

| کاربر | رمز | نقش |
|---|---|---|
| `takhti` | `123456` | مدیر |
| `esfandiari` | `123456` | سرپرست |
| `azmian` | `123456` | تکنسین |

---

## ۶) رفع اشکال

| نشانه | علت رایج | راه‌حل |
|---|---|---|
| صفحه سفید | wwwroot خالی است | publish را دوباره اجرا کنید؛ `wwwroot\index.html` باید وجود داشته باشد |
| ۵۰۲/۵۰۳ IIS | Runtime 10 نصب نیست یا App Pool اشتباه است | Hosting Bundle 10 را نصب و App Pool را No Managed Code کنید |
| `Jwt:Key is missing` در لاگ | فایل تنظیمات وجود ندارد | `setup-appsettings.ps1` را اجرا کنید |
| `Cannot reach the SQL Server database` | connection string/دسترسی | `sqlcmd -S ... -E -Q "SELECT 1"` و لاگ `logs` را ببینید |
| ورود با `123456` کار نمی‌کند | کاربر رمز ندارد و `DefaultUserPassword` خالی است | مقدار را در تنظیمات پر کنید و برنامه را یک‌بار ری‌استارت کنید |
| «گروهی با این نام قبلاً ثبت شده» | ایندکس یکتای نام گروه | نام دیگری انتخاب کنید |
| تغییرات ذخیره نمی‌شود | کاربر نقش Viewer دارد | نقش Admin/Supervisor لازم است |

لاگ‌ها: در IIS مسیر `C:\inetpub\NIPCO-Maintenance\logs` (StdOut) یا Event Viewer.

---

## ۷) نگهداری

* **پشتیبان‌گیری روزانه**:

```sql
BACKUP DATABASE NIPCO_Maintenance
TO DISK = N'D:\Backup\NIPCO_Maintenance.bak' WITH COMPRESSION, INIT;
```

* **تغییر رمز** کاربران از صفحه «کاربران» (پس از تکمیل) یا `POST /api/auth/change-password`.
* **ارتقای نسخه**: پوشه publish جدید را روی فایل‌های قبلی کپی کنید (تنظیمات
  `appsettings.Production.json` را نگه دارید) و اسکریپت‌های `db\02_...` را اجرا کنید.
* **اسکیمای دیتابیس**: منبع حقیقت، اسکریپت‌های پوشه `db` هستند؛ برای هر تغییر یک
  فایل شماره‌دار جدید بسازید و `01_` را تغییر ندهید.
