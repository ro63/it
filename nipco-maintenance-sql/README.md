# NIPCO — سیستم کنترل روزانه تجهیزات (نسخه SQL Server)

نسخه‌ای از برنامه کنترل روزانه تجهیزات که به‌جای `localStorage` روی
**SQL Server** کار می‌کند. رابط کاربری، تم‌ها و صفحات دقیقاً مثل نسخه قبلی حفظ شده‌اند.

| بخش | تکنولوژی |
|---|---|
| رابط کاربری | React 19 + TypeScript + Vite + Tailwind (بدون تغییر ظاهری) |
| API | ASP.NET Core 10 + EF Core 10 + Identity + JWT |
| دیتابیس | SQL Server (اسکریپت نصب مستقل + migration‌پذیر) |

## شروع سریع

```bash
# ۱) دیتابیس
sqlcmd -S .\SQLEXPRESS -E -i db/01_Install_NIPCO_Maintenance.sql

# ۲) UI
npm install
npm run dev            # با API روی http://localhost:5080
npm run dev:demo       # فقط برای دیدن ظاهر، بدون API و دیتابیس

# ۳) API
cd server/Nipco.Maintenance.Api
dotnet run             # http://localhost:5080  (health: /health)
```

ورود: `takhti` / `123456` (مدیر)، `esfandiari` / `123456` (سرپرست)، `azmian` / `123456` (تکنسین).

## انتشار روی سرور

```powershell
powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\publish
```

راهنمای کامل نصب IIS، تنظیم connection string، ساخت کلید JWT و کاربر دیتابیس:
**[docs/install.md](docs/install.md)**

## ساختار

```
db/       اسکریپت نصب دیتابیس (idempotent)
server/   API + میزبانی SPA (net10.0)
src/      کد React (صفحات دست‌نخورده)
deploy/   publish.ps1، install-database.ps1، iis-setup.ps1، start.sh
docs/     راهنمای نصب
```
