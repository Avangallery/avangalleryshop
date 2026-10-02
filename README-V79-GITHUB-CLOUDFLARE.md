# AVAN GALLERY V79 — GitHub + Cloudflare Workers + D1

این نسخه V78 را حفظ می‌کند و Backend واقعی Worker + D1 را اضافه می‌کند. R2 استفاده نمی‌شود.

## 1) Cloudflare
1. در Cloudflare > D1 یک دیتابیس با نام `avan-gallery-db` بسازید.
2. UUID دیتابیس را بردارید.
3. در `wrangler.jsonc` مقدار `PASTE_YOUR_D1_DATABASE_ID_HERE` را با UUID واقعی جایگزین کنید.
4. در Worker > Settings > Variables and Secrets یک Secret به نام `ADMIN_PASSWORD` بسازید و مقدار آن را `avan` قرار دهید.
5. بعد از اولین deploy، migration را اجرا کنید:
   `npx wrangler d1 execute avan-gallery-db --remote --file=./schema.sql`

## 2) GitHub
کل پروژه را داخل Repository قرار دهید و روی branch `main` push کنید.
برای Deploy خودکار، در GitHub > Settings > Secrets and variables > Actions این دو Secret را اضافه کنید:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Workflow داخل `.github/workflows/deploy.yml` با هر push به `main` اجرا می‌شود.

## 3) تست
- `/admin` صفحه ورود است.
- رمز: `avan`
- `/api/products` محصولات D1 را برمی‌گرداند.
- افزودن/ویرایش/حذف محصول از پنل، D1 را تغییر می‌دهد.

## مهم
اگر D1 قبلاً جدول `products` با ساختار متفاوت دارد، قبل از اجرای schema ساختار آن را بررسی کنید؛ این فایل جدول موجود را حذف نمی‌کند.
