# راهنمای نصب گام‌به‌گام — سیستم کنترل روزانه تجهیزات NIPCO

> این راهنما برای کسی نوشته شده که **برنامه‌نویس نیست**. هر مرحله را به‌ترتیب انجام دهید.
> زمان تقریبی: ۳۰ تا ۴۵ دقیقه.
> **ظاهر و صفحات برنامه تغییر نکرده‌اند**؛ فقط داده‌ها در SQL Server ذخیره می‌شوند.

---

## خلاصه در یک نگاه

```
[ کامپیوتر شما یا سرور ]                      [ همان سرور ]
 1. نصب SQL Server            ─────────────►  دیتابیس NIPCO_Maintenance
 2. نصب .NET Runtime 10       ─────────────►  اجرای فایل‌های برنامه
 3. اجرای publish             ─────────────►  پوشه C:\NIPCO\publish
 4. کپی پوشه روی سرور + IIS   ─────────────►  آدرس http://SERVER
 5. ورود با takhti / 123456   ─────────────►  استفاده روزانه
```

فایل‌ها و پوشه‌هایی که کار می‌کنند:

| مسیر | توضیح |
|---|---|
| `deploy\publish.ps1` | ساخت بسته نصب (روی کامپیوتر شما) |
| `db\01_Install_NIPCO_Maintenance.sql` | ساخت دیتابیس |
| `db\install-database.ps1` | اجرای همین اسکریپت + بررسی |
| `db\verify-database.sql` | بررسی صحت نصب |
| `deploy\setup-appsettings.ps1` | ساخت فایل تنظیمات با کلید امنیتی |
| `deploy\iis-setup.ps1` | راه‌اندازی سایت در IIS |
| `deploy\install-windows-service.ps1` | اجرا بدون IIS |
| `deploy\healthcheck.ps1` | بررسی سلامت نصب |
| `docs\install.md` | مرجع فنی کامل |

---

## مرحله ۱ — نصب SQL Server

1. اگر SQL Server ندارید: **SQL Server Express** را نصب کنید
   (گزینه *Basic* کافی است) — نام نمونه پیش‌فرض: `SQLEXPRESS`.
2. مطمئن شوید سرویس `SQL Server (SQLEXPRESS)` در `services.msc` در حالت Running است.
3. برای دستورات خط فرمان، **SQL Server Command Line Utilities** را هم نصب کنید
   (یا از SSMS استفاده کنید).

تست سریع در PowerShell:

```powershell
sqlcmd -S .\SQLEXPRESS -E -Q "SELECT @@VERSION"
```

اگر نسخه SQL Server را چاپ کرد، این مرحله تمام است.

---

## مرحله ۲ — نصب پیش‌نیاز اجرای برنامه

فقط **ASP.NET Core Runtime 10** (شامل .NET Runtime) لازم است:

* دانلود: `ASP.NET Core Runtime 10.0.x — Windows Hosting Bundle` (اگر با IIS کار می‌کنید
  همین Hosting Bundle را نصب کنید؛ Runtime معمولی هم داخلش هست).
* بعد از نصب، در PowerShell تست کنید:

```powershell
dotnet --list-runtimes
```

باید خطی شامل `Microsoft.AspNetCore.App 10.` ببینید.

> اگر می‌خواهید خودتان بسته نصب را بسازید، روی **همین** ماشین
> Node.js 20 و **.NET SDK 10** را هم نصب کنید (Runtime کافی نیست).

---

## مرحله ۳ — ساخت بسته نصب

پوشه `nipco-maintenance-sql` را روی کامپیوتر خود باز کنید و در PowerShell اجرا کنید:

```powershell
cd nipco-maintenance-sql
powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\publish
```

در پایان پیام `Install folder ready: C:\NIPCO\publish` را می‌بینید.

اگر خطا گرفت:

| خطا | راه‌حل |
|---|---|
| `npm was not found` | Node.js 20+ نصب کنید |
| `dotnet was not found` / SDK 10 نیست | .NET SDK 10 نصب کنید |
| `npm ci failed` | پوشه `node_modules` را پاک کنید و دوباره اجرا کنید |
| `vite build failed` | متن خطا را بفرستید؛ معمولاً یک خطای TypeScript است |

> **بدون ساختن بسته:** اگر بسته آماده (artifact از GitHub Actions یا پوشه
> `NIPCO-Maintenance-install`) گرفته‌اید، این مرحله را رد کنید؛ همان محتوا معادل
> `C:\NIPCO\publish` است.

---

## مرحله ۴ — ساخت دیتابیس

پوشه `C:\NIPCO\publish` را به سرور منتقل کنید (مثلاً همان مسیر). سپس روی سرور:

```powershell
cd C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File db\install-database.ps1 -Server ".\SQLEXPRESS"
```

در پایان باید ببینید:

```
Tables 15 | Equipment groups 5 | Equipment 22 | Checklist items 28 | Users 3 | Roles 4
Database NIPCO_Maintenance is ready.
```

اسکریپت را می‌توانید بی‌خطر چند بار اجرا کنید؛ چیزی خراب نمی‌شود.

### کاربر مخصوص برنامه (توصیه‌شده)

در SSMS با کاربر مدیر اجرا کنید (رمز را عوض کنید):

```sql
USE master;
CREATE LOGIN nipco_app WITH PASSWORD = N'Ramz-e-Ghavi-1404!';
GO
USE NIPCO_Maintenance;
CREATE USER nipco_app FOR LOGIN nipco_app;
ALTER ROLE db_datareader ADD MEMBER nipco_app;
ALTER ROLE db_datawriter ADD MEMBER nipco_app;
GO
```

---

## مرحله ۵ — ساخت فایل تنظیمات

```powershell
cd C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 `
  -AppPath C:\NIPCO\publish -Server ".\SQLEXPRESS" `
  -UseSqlLogin -SqlUser nipco_app -SqlPassword 'Ramz-e-Ghavi-1404!'
```

اگر می‌خواهید با احراز هویت ویندوز کار کند (بدون رمز در فایل)، `-UseSqlLogin` و
پارامترهایش را حذف کنید.
این اسکریپت فایل `appsettings.Production.json` را با یک **کلید امنیتی تصادفی** می‌سازد.

---

## مرحله ۶ — راه‌اندازی روی IIS

۱. در *Server Manager* نقش **Web Server (IIS)** را نصب کنید.
۲. Hosting Bundle نسخه ۱۰ را نصب کنید (مرحله ۲).
۳. در PowerShell با دسترسی Administrator:

```powershell
cd C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File deploy\iis-setup.ps1 `
  -PhysicalPath C:\NIPCO\publish -Port 80
```

۴. مسیر سایت را برابر همان پوشه publish بگذارید (اسکریپت این کار را می‌کند).
۵. اگر SQL با احراز هویت ویندوز است، به کاربر Application Pool دسترسی بدهید:

```sql
CREATE LOGIN [IIS APPPOOL\NIPCO-Maintenance-Pool] FROM WINDOWS;
USE NIPCO_Maintenance;
CREATE USER [IIS APPPOOL\NIPCO-Maintenance-Pool] FOR LOGIN [IIS APPPOOL\NIPCO-Maintenance-Pool];
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\NIPCO-Maintenance-Pool];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\NIPCO-Maintenance-Pool];
GO
```

۶. فراموش نکنید روزنه فایروال پورت ۸۰:

```powershell
New-NetFirewallRule -DisplayName "NIPCO Web" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

### اگر IIS نمی‌خواهید

```powershell
powershell -ExecutionPolicy Bypass -File deploy\install-windows-service.ps1 `
  -AppPath C:\NIPCO\publish -Port 8080
```

سپس آدرس `http://SERVER:8080` را باز کنید. در این حالت برای SQL بهتر است از
`-UseSqlLogin` استفاده کنید.

---

## مرحله ۷ — بررسی نهایی و ورود

```powershell
powershell -ExecutionPolicy Bypass -File deploy\healthcheck.ps1 -Url http://localhost
```

خروجی سالم:

```
HTTP 200
{"status":"ok","database":"reachable","utc":"..."}
SPA is served correctly.
```

سپس در مرورگر آدرس سرور را باز کنید و وارد شوید:

| کاربر | رمز | نقش |
|---|---|---|
| `takhti` | `123456` | مدیر |
| `esfandiari` | `123456` | سرپرست |
| `azmian` | `123456` | تکنسین |

**همین اول رمزها را عوض کنید** (صفحه «کاربران» یا API تغییر رمز).

---

## کارهای روزمره

* **پشتیبان‌گیری روزانه** (در SQL Server Agent یا Task Scheduler):

```sql
BACKUP DATABASE NIPCO_Maintenance
TO DISK = N'D:\Backup\NIPCO_Maintenance.bak' WITH COMPRESSION, INIT;
```

* **به‌روزرسانی برنامه**: بسته جدید را روی `C:\NIPCO\publish` کپی کنید
  (`appsettings.Production.json` را نگه دارید) و اسکریپت‌های `db\02_...` را اجرا کنید.
* **گزارش‌ها**: `GET /api/reports/dashboard`، `/inspection-trend`، `/problem-items`.

---

## مشکلات رایج

| نشانه | علت | راه‌حل |
|---|---|---|
| صفحه سفید | `wwwroot\index.html` نیست | publish را دوباره اجرا کنید |
| خطای 500.30 در IIS | Runtime 10 نصب نیست | Hosting Bundle را نصب کنید |
| `Jwt:Key is missing` | فایل تنظیمات نیست | مرحله ۵ را اجرا کنید |
| `Cannot reach the SQL Server database` | connection string یا دسترسی | `sqlcmd -S .\SQLEXPRESS -E -Q "SELECT 1"` |
| ورود با 123456 کار نمی‌کند | `DefaultUserPassword` خالی است | مقدار را پر کنید و سرویس را ری‌استارت کنید |
| «نشست شما منقضی شده است» | ۱۲ ساعت گذشته | دوباره وارد شوید |
| فارسی به‌صورت علامت سؤال | collation دیتابیس | دیتابیس با `Persian_100_CI_AS` ساخته می‌شود؛ اسکریپت را دوباره اجرا نکنید مگر خالی باشد |

اگر جایی گیر کردید، متن کامل خطا (یا عکس صفحه) را بفرستید تا همان نقطه را درست کنم.
