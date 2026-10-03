# AVAN GALLERY V81 — D1 Products

این نسخه بر پایه V80 ساخته شده است.

- اتصال Worker به D1 با database_id موجود حفظ شده است.
- جدول products از طریق GitHub Actions قبل از Deploy با schema.sql ایجاد/به‌روزرسانی می‌شود.
- پنل مدیریت محصولات از API و D1 استفاده می‌کند.
- فروشگاه محصولات را از GET /api/products می‌خواند.
- R2 استفاده نمی‌شود.

## GitHub Secrets

این دو Secret باید در Repository موجود باشند:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

API Token باید اجازه D1 برای اجرای schema و همچنین Workers deployment را داشته باشد.
