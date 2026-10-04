# AVAN GALLERY V107 — Google Login Fix

این نسخه Client ID را در wrangler.jsonc به صورت Variable قرار می‌دهد تا در هر Deploy وجود داشته باشد.
Client Secret عمداً داخل فایل قرار نگرفته است و باید در Cloudflare Production با نام GOOGLE_CLIENT_SECRET به صورت Secret تنظیم شود.

Redirect URI:
https://avangalleryshop.avangallery.workers.dev/api/auth/google/callback
