# دانلود و نصب — از صفر تا اجرا

این صفحه برای کسی است که فقط می‌خواهد برنامه را دانلود و نصب کند.
اگر فقط می‌خواهید **ظاهر** را ببینید، بخش «فقط دیدن ظاهر» را بخوانید.

---

## بخش ۰ — فقط دیدن ظاهر (۲ دقیقه، بدون نصب چیزی)

1. فایل `NIPCO-demo-single-file.html` را دانلود کنید.
2. روی آن دوبار کلیک کنید (در Chrome یا Edge باز می‌شود).
3. ورود: کاربر `takhti` و رمز `123456`.

همین. هیچ دیتابیس و هیچ نصبی لازم نیست. این فایل فقط برای دیدن ظاهر است.

**لینک دانلود مستقیم:**

```
https://github.com/ro63/it/raw/main/nipco-maintenance-sql/NIPCO-demo-single-file.html
```

> اگر با کلیک روی لینک، متن فایل باز شد، کلیک راست → «Save as» کنید.

---

## بخش ۱ — دانلود کل برنامه

### روش الف: دانلود ZIP از GitHub (پیشنهادی)

1. آدرس زیر را در مرورگر باز کنید:

```
https://github.com/ro63/it
```

2. دکمهٔ سبز **Code** را بزنید → **Download ZIP**.
3. فایل `it-main.zip` دانلود می‌شود.

### روش ب: خط فرمان (اگر Git دارید)

```cmd
git clone https://github.com/ro63/it.git
```

### باز کردن ZIP

فایل ZIP را روی درایو خود **Extract** کنید؛ مثلاً:

```
C:\NIPCO\source\
```

بعد از Extract باید این پوشه‌ها را ببینید:

```
C:\NIPCO\source\
  README.md
  nipco-maintenance\            ← نسخه قدیمی (دست نزنید)
  nipco-maintenance-sql\        ← ← ← این نسخه‌ای است که نصب می‌کنید
```

---

## بخش ۲ — ساخت بسته نصب (۵ تا ۱۵ دقیقه، یک بار)

> این مرحله روی **کامپیوتر ویندوز** انجام می‌شود (می‌تواند همان سرور باشد).
> به اینترنت نیاز دارد.

1. وارد پوشه شوید:

```
C:\NIPCO\source\nipco-maintenance-sql\
```

2. روی فایل **`build-package.cmd`** دوبار کلیک کنید.

این فایل خودش:

* اگر **Node.js** نصب نباشد، نصبش می‌کند.
* اگر **.NET SDK 10** نصب نباشد، نصبش می‌کند.
* بسته نصب را می‌سازد.

3. در پایان این پیام را می‌بینید:

```
Package ready:  C:\NIPCO\source\nipco-maintenance-sql\publish
```

و فایل `publish.zip` ساخته می‌شود.

> **نکته:** اگر بعد از نصب خودکار ابزارها خطا گرفت، پنجره را ببندید،
> یک پنجره جدید باز کنید و دوباره `build-package.cmd` را اجرا کنید
> (تغییرات PATH بعد از بستن پنجره اعمال می‌شوند).

> **بدون نیاز به .NET روی سرور؟** در PowerShell این را اجرا کنید:
> ```powershell
> cd C:\NIPCO\source\nipco-maintenance-sql
> powershell -ExecutionPolicy Bypass -File deploy\build-package.ps1 -SelfContained
> ```

---

## بخش ۳ — نصب روی سرور

### ۳-۱ کپی کردن

پوشه `publish` (یا محتوای `publish.zip`) را روی سرور در این مسیر کپی کنید:

```
C:\NIPCO\app\
```

### ۳-۲ نصب SQL Server (اگر ندارید)

SQL Server Express را نصب کنید (گزینهٔ *Basic*). نام نمونه: `SQLEXPRESS`.

تست:

```powershell
sqlcmd -S .\SQLEXPRESS -E -Q "SELECT @@VERSION"
```

### ۳-۳ ساخت دیتابیس

```powershell
cd C:\NIPCO\app
powershell -ExecutionPolicy Bypass -File db\install-database.ps1 -Server ".\SQLEXPRESS"
```

باید ببینید: `Equipment 22 | Checklist items 28 | Users 3` و در پایان
`Database NIPCO_Maintenance is ready.`

### ۳-۴ ساخت فایل تنظیمات

```powershell
powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 -AppPath C:\NIPCO\app -Server ".\SQLEXPRESS"
```

### ۳-۵ اجرای برنامه

**الف) اجرای ساده (برای تست):**

```powershell
cd C:\NIPCO\app
dotnet Nipco.Maintenance.Api.dll --urls http://0.0.0.0:8080
```

مرورگر: `http://localhost:8080` → ورود `takhti` / `123456`

**ب) نصب روی IIS (محیط واقعی):**

1. نقش IIS و **ASP.NET Core Hosting Bundle 10** را نصب کنید.
2. در PowerShell با دسترسی Administrator:

```powershell
cd C:\NIPCO\app
powershell -ExecutionPolicy Bypass -File deploy\iis-setup.ps1 -PhysicalPath C:\NIPCO\app -Port 80
```

3. مرورگر: `http://<آدرس-سرور>`

**ج) اجرا بدون IIS (به‌صورت خودکار با شروع ویندوز):**

```powershell
powershell -ExecutionPolicy Bypass -File deploy\install-windows-service.ps1 -AppPath C:\NIPCO\app -Port 8080
```

### ۳-۶ بررسی نهایی

```powershell
powershell -ExecutionPolicy Bypass -File deploy\healthcheck.ps1 -Url http://localhost
```

خروجی سالم: `{"status":"ok","database":"reachable"}`

---

## بخش ۴ — ورود و شروع استفاده

| کاربر | رمز | نقش |
|---|---|---|
| `takhti` | `123456` | مدیر |
| `esfandiari` | `123456` | سرپرست |
| `azmian` | `123456` | تکنسین |

**اولین کار:** رمزها را عوض کنید.

---

## اگر جایی گیر کردید

| مشکل | علت | راه‌حل |
|---|---|---|
| `build-package.cmd` پنجره را باز و بسته می‌کند | خطا در ساخت | فایل را از داخل `cmd` اجرا کنید تا متن خطا بماند |
| `npm was not found` | Node.js نصب نشده | Node.js LTS را از nodejs.org نصب و پنجره را نو کنید |
| `dotnet` شناخته نمی‌شود | SDK نصب نشده / پنجره قدیمی | پنجره جدید باز کنید |
| صفحه سفید در مرورگر | فایل‌های UI در `wwwroot` نیست | publish را دوباره اجرا کنید |
| خطای دیتابیس | SQL Server یا نام نمونه اشتباه | بخش ۳-۲ را بررسی کنید |
| رمز ۱۲۳۴۵۶ کار نمی‌کند | `DefaultUserPassword` خالی | در `appsettings.Production.json` پر کنید و اجرا را ری‌استارت کنید |

راهنمای کامل‌تر: `docs/install-guide.md` — مرجع فنی: `docs/install.md`
