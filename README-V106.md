# AVAN GALLERY V106 — Google Login

این نسخه ورود مشتری با Google OAuth 2.0 را برای Cloudflare Workers + D1 اضافه می‌کند.

## Cloudflare variables (Production)
- `GOOGLE_CLIENT_ID` — Variable
- `GOOGLE_CLIENT_SECRET` — Secret

## Google OAuth redirect URI
`https://avangalleryshop.avangallery.workers.dev/api/auth/google/callback`

## Routes
- `/api/auth/google`
- `/api/auth/google/callback`
- `/api/auth/me`
- `/api/auth/logout`
- `/account.html`

جدول `users` در اولین callback نیز به صورت خودکار ساخته می‌شود؛ نسخه schema نیز شامل آن است.

**مهم:** Client Secret نباید داخل GitHub، ZIP عمومی یا فایل frontend قرار بگیرد.
