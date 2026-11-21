# NIPCO — سیستم کنترل روزانه تجهیزات (SQL Server)

نسخه آماده نصب برنامه کنترل روزانه تجهیزات. **ظاهر، صفحات و تم‌ها دقیقاً مثل نسخه قبلی**
حفظ شده‌اند؛ فقط محل ذخیره داده از حافظه مرورگر به **SQL Server** منتقل شده است.

| بخش | تکنولوژی |
|---|---|
| رابط کاربری | React 19 + TypeScript + Vite + Tailwind (بدون تغییر ظاهری) |
| API | ASP.NET Core 10 + EF Core 10 + Identity + JWT |
| دیتابیس | SQL Server (اسکریپت نصب مستقل و idempotent) |

## نصب (خلاصه)

```powershell
# ۱) روی ماشین Build — ساده‌ترین راه: دوبار کلیک روی build-package.cmd
powershell -ExecutionPolicy Bypass -File deploy\build-package.ps1

# ۲) روی سرور: پوشه C:\NIPCO\publish را کپی کنید، سپس
powershell -ExecutionPolicy Bypass -File db\install-database.ps1 -Server ".\SQLEXPRESS"
powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 -AppPath C:\NIPCO\publish
powershell -ExecutionPolicy Bypass -File deploy\iis-setup.ps1 -PhysicalPath C:\NIPCO\publish -Port 80
powershell -ExecutionPolicy Bypass -File deploy\healthcheck.ps1 -Url http://localhost

# ۳) ورود: takhti / 123456
```

**تازه‌کار هستید؟** [docs/download-and-install.md](docs/download-and-install.md) — دانلود، ساخت بسته و نصب گام‌به‌گام.

راهنماها:

* **[docs/install-guide.md](docs/install-guide.md)** — راهنمای گام‌به‌گام فارسی (برای شروع از این استفاده کنید)
* **[docs/install.md](docs/install.md)** — مرجع فنی، تنظیمات و API

### ساخت بسته

* ویندوز: روی `build-package.cmd` دوبار کلیک کنید؛ پیش‌نیازها خودکار نصب می‌شوند و
  خروجی `publish\` و `publish.zip` است.
* یا: `powershell -ExecutionPolicy Bypass -File deploy\build-package.ps1 -SelfContained`
  (Runtime داخل بسته، سرور به هیچ پیش‌نیاز .NET نیاز ندارد)

## دیدن ظاهر بدون دیتابیس

فایل `NIPCO-demo-single-file.html` را دانلود و باز کنید (یک فایل، بدون سرور) —
ورود: `takhti` / `123456`. توضیح بیشتر: [docs/preview.md](docs/preview.md)

> این فایل فقط برای دیدن ظاهر است. در نسخه واقعی، داده‌ها از SQL Server خوانده می‌شوند
> و هیچ داده نمونه‌ای در بسته نصب وجود ندارد (خودکار در GitHub Actions بررسی می‌شود).

## ساختار

```
db/        اسکریپت نصب + بررسی دیتابیس + install-database.ps1
server/    API + میزبانی SPA (net10.0)
src/       کد React (صفحات دست‌نخورده، فقط لایه داده به API وصل شده)
deploy/    publish / iis / service / appsettings / healthcheck
docs/      راهنمای نصب و پیش‌نمایش
demo-ui/   بیلد نمایشی چندفایلی (فقط برای دیدن ظاهر)
```

## نکات امنیتی

* رمز کاربران اولیه در SQL ذخیره نمی‌شود؛ API در اولین اجرا رمز پیش‌فرض را با
  الگوریتم استاندارد Identity تنظیم می‌کند. آن را بعد از اولین ورود تغییر دهید.
* `Jwt:Key` را با `deploy\setup-appsettings.ps1` بسازید (کلید تصادفی ۴۸ بایتی).
* برای عملیات واقعی از کاربر SQL با دسترسی `db_datareader`/`db_datawriter`
  استفاده کنید (نه `sa`).
