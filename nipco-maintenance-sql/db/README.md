# اسکریپت‌های دیتابیس

| فایل | کار |
|---|---|
| `01_Install_NIPCO_Maintenance.sql` | ساخت دیتابیس `NIPCO_Maintenance`، جداول، ایندکس‌ها و داده‌های اولیه |
| `verify-database.sql` | کنترل صحت نصب (تعداد رکوردها و یکپارچگی روابط) |
| `install-database.ps1` | اجرای هر دو اسکریپت بالا با یک دستور |

## اجرا

```powershell
sqlcmd -S .\SQLEXPRESS -E -i 01_Install_NIPCO_Maintenance.sql
# یا (اجرای نصب + بررسی خودکار)
powershell -ExecutionPolicy Bypass -File install-database.ps1 -Server ".\SQLEXPRESS"
```

اسکریپت idempotent است؛ اجرای دوباره چیزی را خراب نمی‌کند (فقط اجزای نبود‌شده ساخته
می‌شوند و داده‌های نمونه فقط روی جداول خالی درج می‌شوند). اجرای هر فایل در
`dbo.SchemaHistory` ثبت می‌شود.

## قواعد نسخه‌های بعدی

* هیچ‌وقت `01_` را تغییر ندهید اگر روی سرور اجرا شده است.
* برای هر تغییر، فایل جدید `02_...sql`، `03_...sql` بسازید و همیشه
  `IF NOT EXISTS` / `IF COL_LENGTH(...) IS NULL` را رعایت کنید.
* دستورات را در تراکنش بگذارید تا نیمه‌کاره نمانند:

```sql
BEGIN TRANSACTION;
-- changes
COMMIT TRANSACTION;
```
